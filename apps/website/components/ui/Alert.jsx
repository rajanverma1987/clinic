'use client';

import { CheckIcon, HelpCircleIcon, InfoIcon, WarningIcon, XIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext.jsx';
import './Alert.css';
import { Button } from './Button';

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
  const { t } = useI18n();
  if (!isOpen) return null;

  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (type) {
      case 'success':
        return <CheckIcon className='icon icon-md' />;
      case 'error':
        return <XIcon className='icon icon-md' />;
      case 'warning':
        return <WarningIcon className='icon icon-md' />;
      case 'confirm':
        return <HelpCircleIcon className='icon icon-md' />;
      default: // info
        return <InfoIcon className='icon icon-md' />;
    }
  };

  const getDefaultActions = () => {
    if (actions.length > 0) return actions;

    switch (type) {
      case 'confirm':
        return [
          { label: t('common.cancel'), onClick: onClose, variant: 'outline' },
          { label: t('common.confirm'), onClick: onClose, variant: 'primary' },
        ];
      case 'error':
      case 'warning':
      case 'info':
      case 'success':
      default:
        return [{ label: t('common.ok'), onClick: onClose, variant: 'primary' }];
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
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            className='Alert-close'
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <XIcon className='icon icon-sm' />
          </Button>
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
