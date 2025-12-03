/**
 * Toast Notification Utility
 * Provides a simple toast notification system for the entire application
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return `<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`;
      case 'error':
        return `<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`;
      case 'warning':
        return `<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>`;
      case 'info':
        return `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`;
      default:
        return '';
    }
  }

  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  show(options: ToastOptions) {
    const {
      message,
      type = 'info',
      duration = 5000,
    } = options;

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
      <div class="flex items-start gap-3 min-w-[300px] max-w-md p-4 ${bgColor} border rounded-lg shadow-lg">
        <div class="flex-shrink-0 mt-0.5">
          ${icon}
        </div>
        <div class="flex-1 text-sm text-gray-800 font-medium">
          ${message}
        </div>
        <button 
          onclick="this.closest('[id^=toast-]').remove()" 
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
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

  remove(id: string) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }
  }

  success(message: string, duration?: number) {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number) {
    return this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number) {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    return this.show({ message, type: 'info', duration });
  }
}

// Export singleton instance
export const toast = new ToastManager();

// Convenience exports
export const showToast = (message: string, type?: ToastType, duration?: number) => {
  return toast.show({ message, type, duration });
};

export const showSuccess = (message: string, duration?: number) => toast.success(message, duration);
export const showError = (message: string, duration?: number) => toast.error(message, duration);
export const showWarning = (message: string, duration?: number) => toast.warning(message, duration);
export const showInfo = (message: string, duration?: number) => toast.info(message, duration);

