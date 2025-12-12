/**
 * Premium Toast Notification System for Healthcare Platform
 * Provides a professional toast notification system aligned with clinic theme
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
        z-index: var(--z-toast, 10060);
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
    const getIconColor = (type) => {
      switch (type) {
        case 'success':
          return 'var(--color-secondary-600)';
        case 'error':
          return 'var(--color-status-error)';
        case 'warning':
          return 'var(--color-status-warning)';
        case 'info':
        default:
          return 'var(--color-primary-600)';
      }
    };

    const getIconBg = (type) => {
      switch (type) {
        case 'success':
          return 'var(--color-secondary-100)';
        case 'error':
          return 'rgba(239, 68, 68, 0.1)';
        case 'warning':
          return 'rgba(245, 158, 11, 0.1)';
        case 'info':
        default:
          return 'var(--color-primary-100)';
      }
    };

    switch (type) {
      case 'success':
        return `<div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: ${getIconBg(type)}; color: ${getIconColor(type)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>`;
      case 'error':
        return `<div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: ${getIconBg(type)}; color: ${getIconColor(type)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>`;
      case 'warning':
        return `<div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: ${getIconBg(type)}; color: ${getIconColor(type)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>`;
      case 'info':
        return `<div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: ${getIconBg(type)}; color: ${getIconColor(type)}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>`;
      default:
        return '';
    }
  }

  getStyles(type) {
    switch (type) {
      case 'success':
        return {
          bg: '#FFFFFF',
          border: '#27AE60',
          text: '#1A1A1A',
        };
      case 'error':
        return {
          bg: '#FFFFFF',
          border: '#EB5757',
          text: '#1A1A1A',
        };
      case 'warning':
        return {
          bg: '#FFFFFF',
          border: '#F2C94C',
          text: '#1A1A1A',
        };
      case 'info':
        return {
          bg: '#FFFFFF',
          border: '#2D9CDB',
          text: '#1A1A1A',
        };
      default:
        return {
          bg: '#FFFFFF',
          border: '#E6E9EE',
          text: '#1A1A1A',
        };
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

    const styles = this.getStyles(type);
    const icon = this.getIcon(type);

    // Use theme colors from CSS variables
    const getThemeBorderColor = (type) => {
      switch (type) {
        case 'success':
          return 'var(--color-secondary-300)';
        case 'error':
          return 'var(--color-status-error)';
        case 'warning':
          return 'var(--color-status-warning)';
        case 'info':
        default:
          return 'var(--color-primary-300)';
      }
    };

    toast.innerHTML = `
      <div class="Toast Toast--${type}" style="
        display: flex;
        align-items: start;
        gap: 12px;
        min-width: 320px;
        max-width: 420px;
        padding: 16px;
        background: var(--color-neutral-50);
        border: 2px solid ${getThemeBorderColor(type)};
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(12px);
      ">
        ${icon}
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding-top: 2px;">
          <div style="
            font-size: var(--text-body-sm);
            line-height: var(--text-body-sm-line-height);
            color: var(--color-neutral-900);
            font-weight: 600;
            letter-spacing: -0.01em;
          ">
            ${message}
          </div>
        </div>
        <button
          onclick="this.closest('[id^=toast-]').remove()"
          style="
            flex-shrink: 0;
            color: var(--color-neutral-500);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-center;
            transition: all 0.2s;
            width: 28px;
            height: 28px;
          "
          onmouseover="this.style.background='var(--color-neutral-100)'; this.style.color='var(--color-neutral-900)';"
          onmouseout="this.style.background='transparent'; this.style.color='var(--color-neutral-500)';"
          aria-label="Close notification"
        >
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

// Convenience exports
export const showToast = (message, type, duration) => {
  return toast.show({ message, type, duration });
};

export const showSuccess = (message, duration) => toast.success(message, duration);
export const showError = (message, duration) => toast.error(message, duration);
export const showWarning = (message, duration) => toast.warning(message, duration);
export const showInfo = (message, duration) => toast.info(message, duration);
