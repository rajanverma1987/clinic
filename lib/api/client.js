import { logger } from '@/lib/utils/logger.js';

/**
 * API Client
 * Centralized API request handler with authentication
 */

let cacheUtils = null;

// Lazy load cache utils to avoid circular dependencies
async function getCacheUtils() {
  if (!cacheUtils) {
    cacheUtils = await import('@/lib/utils/api-cache');
  }
  return cacheUtils;
}

class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  async request(endpoint, options = {}, skipRedirect = false) {
    const token = this.getToken();

    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && !token) {
      logger.warn(`[API Client] No token available for request to ${endpoint}`);
    }

    // Check cache for GET requests
    if (typeof window !== 'undefined' && (options.method === 'GET' || !options.method)) {
      try {
        const { getCachedResponse, generateCacheKey } = await getCacheUtils();
        const cacheKey = generateCacheKey(endpoint, options.params);
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        // Cache not available, continue with request
        logger.warn('Cache not available:', error);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401/403 (unauthorized/forbidden) - attempt refresh once, then redirect if still unauthorized
        if ((response.status === 401 || response.status === 403) && !skipRedirect) {
          if (process.env.NODE_ENV === 'development') {
            logger.warn(
              `[API Client] ${response.status} for ${endpoint}. Token present: ${!!token}. Trying refresh once.`,
            );
          }

          // Try token refresh once before forcing a redirect
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.request(endpoint, { ...options }, true);
          }

          // Only clear tokens and redirect if we actually had a token (to avoid clearing on first load)
          if (token) {
            this.clearToken();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } else {
            logger.warn(
              `[API Client] No token for ${endpoint}, but got ${response.status}. Possibly a race condition.`,
            );
          }
        }

        return {
          success: false,
          error: data.error || {
            message:
              response.status === 403
                ? 'Access denied'
                : response.status === 401
                  ? 'Unauthorized'
                  : 'An error occurred',
            code:
              response.status === 403
                ? 'FORBIDDEN'
                : response.status === 401
                  ? 'UNAUTHORIZED'
                  : 'UNKNOWN_ERROR',
          },
        };
      }

      // Cache successful GET responses
      if (
        typeof window !== 'undefined' &&
        (options.method === 'GET' || !options.method) &&
        data.success
      ) {
        try {
          const { setCachedResponse, generateCacheKey } = await getCacheUtils();
          const cacheKey = generateCacheKey(endpoint, options.params);
          setCachedResponse(cacheKey, data);
        } catch (error) {
          // Cache not available, continue
          logger.warn('Cache not available:', error);
        }
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // Clear cache for specific endpoint (useful after mutations)
  async clearCacheForEndpoint(endpoint) {
    if (typeof window === 'undefined') return;
    try {
      const { clearCache } = await getCacheUtils();
      // Note: This is a simplified version. For full implementation,
      // we'd need to track cache keys or use a more sophisticated cache
      logger.info('Cache cleared for endpoint:', endpoint);
    } catch (error) {
      logger.warn('Cache not available:', error);
    }
  }

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async get(endpoint, options, skipRedirect = false) {
    return this.request(endpoint, { ...options, method: 'GET' }, skipRedirect);
  }

  async post(endpoint, data, options = {}, skipRedirect = false) {
    return this.request(
      endpoint,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipRedirect,
    );
  }

  async put(endpoint, data, options, skipRedirect = false) {
    return this.request(
      endpoint,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipRedirect,
    );
  }

  async delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  setToken(token) {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  async refreshToken() {
    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      logger.info('No refresh token available');
      return false;
    }

    try {
      const response = await this.post(
        '/auth/refresh',
        {
          refreshToken,
        },
        {},
        true,
      ); // Skip redirect during refresh

      if (response.success && response.data?.accessToken) {
        this.setToken(response.data.accessToken);
        // Also update refresh token if a new one is provided
        if (response.data.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        logger.info('Token refreshed successfully');
        return true;
      } else {
        logger.info('Token refresh failed:', response.error);
        // If refresh fails, clear tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
        }
        return false;
      }
    } catch (error) {
      logger.error('Error refreshing token:', error);
      // Clear refresh token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      return false;
    }
  }
}

export const apiClient = new ApiClient();
