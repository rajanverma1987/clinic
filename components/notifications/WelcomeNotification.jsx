'use client';

/**
 * Welcome Notification Component
 * Shows a welcome notification when user logs in (only once per session)
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
  const sessionWelcomeShownRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    // Check if welcome was already shown in this session
    if (typeof window !== 'undefined') {
      const welcomeShown = sessionStorage.getItem('welcomeShown');
      if (welcomeShown === 'true') {
        sessionWelcomeShownRef.current = true;
      }
    }
  }, []);

  useEffect(() => {
    // Wait for component to mount and auth to finish loading
    if (!mountedRef.current || loading) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password';

    // Don't show on auth pages
    if (isAuthPage) {
      return;
    }

    // If welcome was already shown in this session, don't show again
    if (sessionWelcomeShownRef.current) {
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
        if (mountedRef.current && !sessionWelcomeShownRef.current) {
          showWelcome(userName, 6000);
          hasShownWelcomeRef.current = true;
          sessionWelcomeShownRef.current = true;
          
          // Mark as shown in session storage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('welcomeShown', 'true');
          }
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
      // User logged out, reset session flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('welcomeShown');
      }
      hasShownWelcomeRef.current = false;
      previousUserRef.current = null;
      sessionWelcomeShownRef.current = false;
    }
  }, [user, loading, showWelcome]);

  return null; // This component doesn't render anything
}
