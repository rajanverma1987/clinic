/**
 * Premium Toast Notification System for Healthcare Platform
 * Provides a professional toast notification system aligned with clinic theme
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.closeAriaLabel = 'Close notification';
  }

  configure({ closeAriaLabel }) {
    if (closeAriaLabel != null) this.closeAriaLabel = closeAriaLabel;
  }

  ensureContainer() {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }
    const existing = document.getElementById('toast-container');
    if (existing) {
      this.container = existing;
      return this.container;
    }
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: var(--z-toast, 10060);
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 420px;
    `;
    document.body.appendChild(this.container);
    return this.container;
  }

  getIcon(type) {
    const iconClass = `Toast-icon Toast-icon--${type}`;
    switch (type) {
      case 'success':
        return `<div class="${iconClass}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: var(--icon-size-sm, 20px); height: var(--icon-size-sm, 20px); flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg></div>`;
      case 'error':
        return `<div class="${iconClass}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: var(--icon-size-sm, 20px); height: var(--icon-size-sm, 20px); flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`;
      case 'warning':
        return `<div class="${iconClass}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: var(--icon-size-sm, 20px); height: var(--icon-size-sm, 20px); flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>`;
      case 'info':
        return `<div class="${iconClass}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: var(--icon-size-sm, 20px); height: var(--icon-size-sm, 20px); flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`;
      default:
        return '';
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
      animation: premium-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="Toast Toast--${type}">
        ${icon}
        <div class="Toast-content">
          <div class="Toast-message">${message}</div>
        </div>
        <button type="button" class="Toast-close" onclick="this.closest('[id^=toast-]').remove()" aria-label="${this.closeAriaLabel}">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        @keyframes premium-slide-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes premium-slide-out {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.95);
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
      toast.style.animation = 'premium-slide-out 0.3s cubic-bezier(0.4, 0, 1, 1)';
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

export const configureToast = (options) => toast.configure(options);

// Convenience exports
export const showToast = (message, type, duration) => {
  return toast.show({ message, type, duration });
};

export const showSuccess = (message, duration) => toast.success(message, duration);
export const showError = (message, duration) => toast.error(message, duration);
export const showWarning = (message, duration) => toast.warning(message, duration);
export const showInfo = (message, duration) => toast.info(message, duration);
