'use client';

import { Button } from './Button';
import './Alert.css';

/**
 * Unified Alert/Popup Component
 * Reusable component for all popup dialogs (info, warning, error, success, confirmation)
 * Uses theme colors and follows design system
 */
export function Alert({
  isOpen,
  onClose,
  type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'confirm'
  icon,
  title,
  message,
  actions = [], // Array of { label, onClick, variant, icon }
  showCloseButton = true,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  if (!isOpen) return null;

  const getDefaultIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return (
          <svg width='24px' height='24px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        );
      case 'error':
        return (
          <svg width='24px' height='24px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        );
      case 'warning':
        return (
          <svg width='24px' height='24px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
          </svg>
        );
      case 'confirm':
        return (
          <svg width='24px' height='24px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      default: // info
        return (
          <svg width='24px' height='24px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
    }
  };

  const getDefaultActions = () => {
    if (actions.length > 0) return actions;

    switch (type) {
      case 'confirm':
        return [
          { label: 'Cancel', onClick: onClose, variant: 'outline' },
          { label: 'Confirm', onClick: onClose, variant: 'primary' },
        ];
      case 'error':
      case 'warning':
      case 'info':
      case 'success':
      default:
        return [{ label: 'Ok', onClick: onClose, variant: 'primary' }];
    }
  };

  return (
    <div className='Alert-backdrop' onClick={onClose}>
      <div
        className={`Alert-container Alert-container--${size} Alert-container--${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {showCloseButton && (
          <button className='Alert-close' onClick={onClose} aria-label='Close'>
            <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className={`Alert-icon Alert-icon--${type}`}>{getDefaultIcon()}</div>

        {/* Content */}
        <div className='Alert-content'>
          {title && <h3 className='Alert-title'>{title}</h3>}
          {message && <p className='Alert-message'>{message}</p>}
        </div>

        {/* Actions */}
        <div className='Alert-actions'>
          {getDefaultActions().map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'primary'}
              size='md'
              onClick={action.onClick}
              className='Alert-action-button'
            >
              {action.icon && <span className='Alert-action-icon'>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

