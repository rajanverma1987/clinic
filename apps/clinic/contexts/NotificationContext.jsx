'use client';

/**
 * Notification Context
 * Provides a React-friendly wrapper around the toast notification system
 */

import { toast } from '@/lib/utils/toast';
import { createContext, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext(undefined);

export function NotificationProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = (message, type = 'info', duration = 5000) => {
    if (!mounted || typeof window === 'undefined') return null;
    return toast.show({ message, type, duration });
  };

  const showSuccess = (message, duration = 5000) => {
    if (!mounted || typeof window === 'undefined') return null;
    return toast.success(message, duration);
  };

  const showError = (message, duration = 5000) => {
    if (!mounted || typeof window === 'undefined') return null;
    return toast.error(message, duration);
  };

  const showWarning = (message, duration = 5000) => {
    if (!mounted || typeof window === 'undefined') return null;
    return toast.warning(message, duration);
  };

  const showInfo = (message, duration = 5000) => {
    if (!mounted || typeof window === 'undefined') return null;
    return toast.info(message, duration);
  };

  const showWelcome = (userName, duration = 6000) => {
    if (!mounted || typeof window === 'undefined') return null;
    const message = `Welcome back, ${userName}! 👋`;
    return toast.show({
      message,
      type: 'success',
      duration,
    });
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showWelcome,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
