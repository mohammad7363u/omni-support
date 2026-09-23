"""Centralized error handling middleware for the OmniSupport API."""

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("OmniSupport")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with timing, method, path, status, and request ID."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed = (time.perf_counter() - start) * 1000
            logger.error(
                "[%s] %s %s → 500 | %.0fms | ERROR: %r",
                request_id,
                request.method,
                request.url.path,
                elapsed,
                exc,
            )
            return JSONResponse(
                status_code=500,
                content={"error": "internal_server_error", "request_id": request_id},
            )

        elapsed = (time.perf_counter() - start) * 1000
        status = response.status_code

        if status >= 500:
            logger.warning(
                "[%s] %s %s → %d | %.0fms", request_id, request.method, request.url.path, status, elapsed
            )
        elif status >= 400:
            logger.info(
                "[%s] %s %s → %d | %.0fms", request_id, request.method, request.url.path, status, elapsed
            )
        else:
            logger.debug(
                "[%s] %s %s → %d | %.0fms", request_id, request.method, request.url.path, status, elapsed
            )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{elapsed:.0f}ms"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    logger.info("Starting OmniSupport AI v%s", app.state.version)
    yield
    logger.info("OmniSupport shutting down")
