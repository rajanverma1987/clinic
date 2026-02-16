'use client';

/**
 * Notification wrapper – provides the toast container in the React tree
 * so toasts render in a single, predictable place. Mount inside NotificationProvider.
 * The toast manager (lib/utils/toast) will use this container when present.
 */
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TOAST_CONTAINER_STYLE = {
  position: 'fixed',
  top: '24px',
  right: '24px',
  zIndex: 'var(--z-toast, 10060)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  pointerEvents: 'none',
  maxWidth: '420px',
};

export function NotificationWrapper({ children }) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return children ? <>{children}</> : null;
  }

  const container = (
    <div
      id='toast-container'
      role='region'
      aria-label={t('common.ariaLabelNotifications')}
      style={TOAST_CONTAINER_STYLE}
    />
  );

  return (
    <>
      {children}
      {createPortal(container, document.body)}
    </>
  );
}
