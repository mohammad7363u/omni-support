// OmniSupport Shared Utilities
// Debounce, throttle, element creation, loading states, toast enhancements

/**
 * Debounce function execution
 * @param {Function} func - function to debounce
 * @param {number} wait - milliseconds to wait
 * @param {boolean} immediate - trigger on leading edge
 */
window.debounce = function(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttle function execution
 */
window.throttle = function(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Create DOM element helper
 */
window.createEl = function(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
};

/**
 * Escape HTML for safe rendering
 */
window.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Show global loading spinner
 */
window.showLoading = function(message = '加载中...') {
  let overlay = document.getElementById('global-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; flex-direction: column; gap: 16px;
    `;
    overlay.innerHTML = `
      <div style="width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.2);
                  border-top-color: #0052FF; border-radius: 50%;
                  animation: spin 0.8s linear infinite;"></div>
      <span style="color: white; font-size: 14px; font-family: var(--font-ui);">${message}</span>
    `;
    document.body.appendChild(overlay);
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
  overlay.style.display = 'flex';
};

/**
 * Hide global loading spinner
 */
window.hideLoading = function() {
  const overlay = document.getElementById('global-loading-overlay');
  if (overlay) overlay.style.display = 'none';
};

/**
 * Enhanced toast with progress bar
 */
window.showToast = function(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <div class="toast-progress" style="position:absolute;bottom:0;left:0;height:3px;background:var(--accent-gradient);border-radius:0 0 var(--radius-lg) var(--radius-lg);transition:width ${duration}ms linear;"></div>
  `;
  toast.style.cssText = 'position:relative;overflow:hidden;';
  container.appendChild(toast);

  // Start progress bar animation
  requestAnimationFrame(() => {
    const progress = toast.querySelector('.toast-progress');
    if (progress) progress.style.width = '0%';
  });

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Add toastOut animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(16px); }
  }
`;
document.head.appendChild(toastStyle);

/**
 * Format datetime with locale
 */
window.formatDateTime = function(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

/**
 * Format relative time
 */
window.formatRelativeTime = function(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff/60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff/3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff/86400)}天前`;
  return d.toLocaleDateString('zh-CN');
};
