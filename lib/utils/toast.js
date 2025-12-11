/**
 * Toast Notification Utility
 * Provides a simple toast notification system for the entire application
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 420px;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return `<svg class="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`;
      case 'error':
        return `<svg class="w-5 h-5 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`;
      case 'warning':
        return `<svg class="w-5 h-5 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>`;
      case 'info':
        return `<svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`;
      default:
        return '';
    }
  }

  getBackgroundColor(type) {
    switch (type) {
      case 'success':
        return 'bg-status-success/10 border-status-success/30';
      case 'error':
        return 'bg-status-error/10 border-status-error/30';
      case 'warning':
        return 'bg-status-warning/10 border-status-warning/30';
      case 'info':
        return 'bg-primary-50 border-primary-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  }

  show(options) {
    const { message, type = 'info', duration = 5000 } = options;

    const container = this.ensureContainer();
    const id = Math.random().toString(36).substr(2, 9);

    const toast = document.createElement('div');
    toast.id = `toast-${id}`;
    toast.style.cssText = `
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
    `;

    const bgColor = this.getBackgroundColor(type);
    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="flex items-start gap-3 min-w-[320px] max-w-md p-4 ${bgColor} border-2 rounded-xl shadow-xl backdrop-blur-sm">
        <div class="flex-shrink-0 mt-0.5">
          ${icon}
        </div>
        <div class="flex-1 text-sm text-neutral-800 font-medium" style="line-height: 20px;">
          ${message}
        </div>
        <button 
          onclick="this.closest('[id^=toast-]').remove()" 
          class="flex-shrink-0 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200 flex items-center justify-center"
          style="width: 20px; height: 20px;"
          aria-label="Close notification"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    container.appendChild(toast);
    this.toasts.set(id, toast);

    // Add animation styles if not already added
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }
  }

  success(message, duration) {
    return this.show({ message, type: 'success', duration });
  }

  error(message, duration) {
    return this.show({ message, type: 'error', duration });
  }

  warning(message, duration) {
    return this.show({ message, type: 'warning', duration });
  }

  info(message, duration) {
    return this.show({ message, type: 'info', duration });
  }
}

// Export singleton instance
export const toast = new ToastManager();

// Convenience exports
export const showToast = (message, type, duration) => {
  return toast.show({ message, type, duration });
};

export const showSuccess = (message, duration) => toast.success(message, duration);
export const showError = (message, duration) => toast.error(message, duration);
export const showWarning = (message, duration) => toast.warning(message, duration);
export const showInfo = (message, duration) => toast.info(message, duration);
