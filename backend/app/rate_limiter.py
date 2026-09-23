"""Token-bucket rate limiter for sensitive API endpoints."""

import time
from collections import defaultdict
from functools import wraps
from typing import Dict, Tuple

from fastapi import HTTPException, Request, status


class RateLimiter:
    """In-memory token bucket rate limiter.

    Each bucket refills at `rate` tokens per second up to `capacity`.
    """

    def __init__(self, capacity: int = 10, rate: float = 2.0):
        self.capacity = capacity
        self.rate = rate
        self._buckets: Dict[str, Tuple[float, float]] = {}

    def _get_bucket(self, key: str) -> Tuple[float, float]:
        now = time.monotonic()
        if key not in self._buckets:
            return (self.capacity, now)
        prev_capacity, prev_time = self._buckets[key]
        elapsed = now - prev_time
        tokens = min(self.capacity, prev_capacity + elapsed * self.rate)
        return (tokens, now)

    def _consume(self, key: str) -> bool:
        tokens, now = self._get_bucket(key)
        if tokens < 1:
            return False
        self._buckets[key] = (tokens - 1, now)
        return True

    def check(self, key: str) -> None:
        if not self._consume(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
            )


# Pre-configured limiters per endpoint type
LOGIN_LIMITER = RateLimiter(capacity=5, rate=0.5)   # 5 attempts / 2s
INSTALL_LIMITER = RateLimiter(capacity=3, rate=0.3)  # 3 attempts / 3s
EXTERNAL_LIMITER = RateLimiter(capacity=10, rate=1.0) # 10 req / 10s

_ip_cache: Dict[str, str] = {}


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    realip = request.headers.get("x-real-ip")
    if realip:
        return realip.strip()
    return request.client.host if request.client else "unknown"
