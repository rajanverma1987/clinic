'use client';

import { CheckIcon, InfoIcon, WarningIcon, XIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useEffect, useState } from 'react';
import { Button } from './Button';
import './Toast.css';

/**
 * Toast Notification Component
 * Reusable toast notification following the design system
 * Uses theme colors and tokens
 */
export function Toast({ message, type = 'info', duration = 5000, onClose, timestamp }) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon className='icon icon-sm' />;
      case 'error':
        return <XIcon className='icon icon-sm' />;
      case 'warning':
        return <WarningIcon className='icon icon-sm' />;
      default: // info
        return <InfoIcon className='icon icon-sm' />;
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  if (!isVisible) return null;

  return (
    <div className={`Toast Toast--${type} ${isVisible ? 'Toast--visible' : 'Toast--hidden'}`}>
      <div className={`Toast-icon Toast-icon--${type}`}>{getIcon()}</div>
      <div className='Toast-content'>
        <div className='Toast-message'>{message}</div>
        {timestamp && <div className='Toast-timestamp'>{formatTime(timestamp)}</div>}
      </div>
      <Button
        variant='ghost'
        size='xs'
        iconOnly
        className='Toast-close'
        onClick={handleClose}
        aria-label={t('common.closeNotification')}
      >
        <XIcon className='icon icon-xs' />
      </Button>
    </div>
  );
}
