'use client';

/**
 * Authentication Context
 * Manages user authentication state
 */

import { apiClient } from '@/lib/api/client.js';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(undefined);

// Idle timeout: 2 hours (120 minutes)
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
// Token refresh threshold: refresh if token expires within next 30 minutes
const TOKEN_REFRESH_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = React.useRef(Date.now());
  const idleTimeoutRef = React.useRef(null);
  const tokenRefreshIntervalRef = React.useRef(null);

  // Update last activity timestamp
  const updateLastActivity = React.useCallback(() => {
    if (user) {
      lastActivityRef.current = Date.now();
      // Reset idle timeout
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      setupIdleTimeout();
    }
  }, [user]);

  // Setup idle timeout - logs out user if inactive for 2 hours
  const setupIdleTimeout = React.useCallback(async () => {
    if (!user) return;

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(async () => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= IDLE_TIMEOUT_MS) {
        console.log('User idle for 2 hours, logging out...');
        // Clear all timeouts and intervals
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        if (tokenRefreshIntervalRef.current) {
          clearInterval(tokenRefreshIntervalRef.current);
          tokenRefreshIntervalRef.current = null;
        }

        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          // Continue with logout even if API call fails
        } finally {
          apiClient.setToken('');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('refreshToken');
            lastActivityRef.current = 0;
          }
          setUser(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }, IDLE_TIMEOUT_MS);
  }, [user]);

  // Setup automatic token refresh on activity
  const setupTokenRefresh = React.useCallback(() => {
    if (!user) return;

    // Clear existing interval
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }

    // Check token expiration periodically and refresh if needed
    tokenRefreshIntervalRef.current = setInterval(async () => {
      if (!user) return;

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      try {
        // Decode token to check expiration (without verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const timeUntilExpiry = expirationTime - Date.now();

        // Refresh token if it expires within the next 30 minutes
        if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS && timeUntilExpiry > 0) {
          console.log('Token expiring soon, refreshing...');
          const refreshed = await apiClient.refreshToken();
          if (refreshed) {
            console.log('Token refreshed successfully');
            updateLastActivity(); // Update activity on successful refresh
          }
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }, [user, updateLastActivity]);

  const checkAuth = async () => {
    // Fast exit if no token - don't block rendering
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Set a shorter timeout for API calls to prevent long blocking
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn('Auth check timeout - proceeding without user');
      // Don't clear user if token exists, just stop loading
    }, 3000); // 3 second timeout for faster UX

    try {
      // Try to get user info - skip redirect during auth check
      let response = await apiClient.get('/auth/me', undefined, true);

      // If failed with 401/403, try to refresh token
      if (
        !response.success &&
        (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'FORBIDDEN')
      ) {
        console.log('Auth failed, attempting token refresh...');
        const refreshed = await apiClient.refreshToken();
        if (refreshed) {
          console.log('Token refreshed, retrying auth check...');
          // Retry after refresh - skip redirect during auth check
          response = await apiClient.get('/auth/me', undefined, true);
        } else {
          console.log('Token refresh failed');
        }
      }

      if (response.success && response.data) {
        console.log('Auth check successful');
        // Map the response to match User interface
        const userData = response.data;
        const userId = userData.id || userData.userId || '';
        setUser({
          userId: userId,
          id: userId, // Add id for compatibility
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || '',
          tenantId: userData.tenantId || '',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
        });
        // Initialize activity tracking after successful auth check
        if (typeof window !== 'undefined') {
          lastActivityRef.current = Date.now();
        }
      } else {
        console.log('Auth check failed:', response.error);
        setUser(null);
        // Only clear tokens if refresh also failed or wasn't attempted
        const refreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) {
          // No refresh token available, clear everything
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      // Only clear tokens if we're sure auth is impossible
      const refreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } finally {
      clearTimeout(timeoutId);
      // Always set loading to false, even if there's an error
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.success && response.data) {
        apiClient.setToken(response.data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', response.data.refreshToken);
          lastActivityRef.current = Date.now(); // Initialize activity tracking
        }
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await apiClient.post('/auth/register', data);

      if (response.success && response.data) {
        apiClient.setToken(response.data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', response.data.refreshToken);
          lastActivityRef.current = Date.now(); // Initialize activity tracking
        }
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = async () => {
    // Clear all timeouts and intervals
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }

    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      apiClient.setToken('');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
        lastActivityRef.current = 0;
      }
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  // Setup activity listeners when user is logged in
  useEffect(() => {
    if (!user) {
      // Clear timeouts and intervals when user logs out
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
        tokenRefreshIntervalRef.current = null;
      }
      return;
    }

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    const handleActivity = () => {
      updateLastActivity();
      // Also refresh token on activity if it's close to expiring
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = payload.exp * 1000;
          const timeUntilExpiry = expirationTime - Date.now();

          // Refresh on activity if token expires within 30 minutes
          if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS && timeUntilExpiry > 0) {
            apiClient.refreshToken().catch((err) => {
              console.error('Failed to refresh token on activity:', err);
            });
          }
        } catch (error) {
          // Ignore token parsing errors
        }
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Setup idle timeout and token refresh
    setupIdleTimeout();
    setupTokenRefresh();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [user, updateLastActivity, setupIdleTimeout, setupTokenRefresh]);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
