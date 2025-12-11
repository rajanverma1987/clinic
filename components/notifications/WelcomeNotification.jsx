'use client';

/**
 * Welcome Notification Component
 * Shows a welcome notification when user logs in
 */

import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useEffect, useRef } from 'react';

export function WelcomeNotification() {
  const { user, loading } = useAuth();
  const { showWelcome } = useNotifications();
  const hasShownWelcomeRef = useRef(false);
  const previousUserRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    // Wait for component to mount and auth to finish loading
    if (!mountedRef.current || loading) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    // Reset refs when on auth pages
    if (isAuthPage) {
      hasShownWelcomeRef.current = false;
      previousUserRef.current = null;
      return;
    }

    // Check if user just logged in (was null, now has value)
    const userJustLoggedIn = !previousUserRef.current && user;

    if (userJustLoggedIn && !hasShownWelcomeRef.current) {
      // Get user's name
      const userName = user?.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
        : user?.email?.split('@')[0] || 'there';

      // Show welcome notification after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          showWelcome(userName, 6000);
          hasShownWelcomeRef.current = true;
        }
      }, 800);

      // Update previous user reference
      previousUserRef.current = user;

      return () => clearTimeout(timer);
    }

    // Update previous user reference
    if (user) {
      previousUserRef.current = user;
    } else {
      // User logged out, reset
      hasShownWelcomeRef.current = false;
      previousUserRef.current = null;
    }
  }, [user, loading, showWelcome]);

  return null; // This component doesn't render anything
}
