import { logger } from '@/lib/utils/logger.js';

/**
 * API Client
 * Centralized API request handler with authentication
 */

let cacheUtils = null;
/** Log cache unavailability only once to avoid console spam when cache is disabled or fails. */
let cacheUnavailableLogged = false;

// Lazy load cache utils to avoid circular dependencies
async function getCacheUtils() {
  if (!cacheUtils) {
    cacheUtils = await import('@/lib/utils/api-cache');
  }
  return cacheUtils;
}

function logCacheUnavailableOnce(error) {
  if (!cacheUnavailableLogged) {
    cacheUnavailableLogged = true;
    logger.debug(
      'API response cache unavailable (optional); requests will proceed without cache.',
      {
        message: error?.message,
      }
    );
  }
}

class ApiClient {
  constructor() {
    // Website app connects to clinic app's API
    const clinicApiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:5053/api'
        : process.env.NEXT_PUBLIC_CLINIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_CLINIC_APP_URL}/api`
          : 'https://accounts.doctorsclinic.services/api');
    this.baseUrl = clinicApiUrl;
    /** Single-flight refresh: only one refresh in progress, others wait for the same promise. */
    this._refreshPromise = null;
  }

  async request(endpoint, options = {}, skipRedirect = false) {
    const token = this.getToken();

    // Debug logging in development (skip for auth endpoints where no token is expected)
    const isLoginOrRegister =
      endpoint === '/auth/login' ||
      endpoint === '/auth/register' ||
      endpoint.startsWith('/auth/forgot');
    if (process.env.NODE_ENV === 'development' && !token && !isLoginOrRegister) {
      logger.warn(`[API Client] No token available for request to ${endpoint}`);
    }

    // Never cache auth endpoints (avoid stale 401 on hard refresh causing logout)
    const isAuthEndpoint =
      endpoint.startsWith('/auth/me') ||
      endpoint === '/auth/me' ||
      endpoint.startsWith('/auth/refresh') ||
      endpoint === '/auth/refresh';

    // Check cache for GET requests (skip for auth – must always hit server)
    if (
      typeof window !== 'undefined' &&
      !isAuthEndpoint &&
      (options.method === 'GET' || !options.method)
    ) {
      try {
        const { getCachedResponse, generateCacheKey } = await getCacheUtils();
        const cacheKey = generateCacheKey(endpoint, options.params);
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        logCacheUnavailableOnce(error);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // TEMPORARY: Test account role override – REMOVE before production
    if (typeof window !== 'undefined') {
      try {
        const override = sessionStorage.getItem('TEST_ACCOUNT_ROLE_OVERRIDE');
        if (override) headers['X-Test-Account-Role'] = override;
      } catch (_) {}
    }

    // Prevent browser from caching auth responses (stale 401 = false logout on hard refresh)
    const fetchOptions = {
      ...options,
      headers: headers,
      ...(isAuthEndpoint ? { cache: 'no-store' } : {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

      const data = await response.json();

      if (!response.ok) {
        // Handle 401/403 (unauthorized/forbidden) - attempt refresh once, then redirect if still unauthorized
        if ((response.status === 401 || response.status === 403) && !skipRedirect) {
          if (process.env.NODE_ENV === 'development') {
            logger.warn(
              `[API Client] ${response.status} for ${endpoint}. Token present: ${!!token}. Trying refresh once.`
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
              `[API Client] No token for ${endpoint}, but got ${response.status}. Possibly a race condition.`
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

      // Cache successful GET responses with TTL by endpoint
      if (
        typeof window !== 'undefined' &&
        (options.method === 'GET' || !options.method) &&
        data.success
      ) {
        try {
          const { setCachedResponse, generateCacheKey, getCacheTtlForEndpoint } =
            await getCacheUtils();
          const cacheKey = generateCacheKey(endpoint, options.params);
          const ttlMs = getCacheTtlForEndpoint(endpoint);
          setCachedResponse(cacheKey, data, ttlMs);
        } catch (error) {
          logCacheUnavailableOnce(error);
        }
      }

      return data;
    } catch (error) {
      const method = options.method || 'GET';
      const isMutation =
        method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
      if (typeof window !== 'undefined' && isMutation) {
        try {
          const { queueMutation } = await import('@/lib/api/offline-queue');
          const url = `${this.baseUrl}${endpoint}`;
          let body = undefined;
          if (options.body) {
            try {
              body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
            } catch {
              body = undefined;
            }
          }
          await queueMutation(method, url, body);
        } catch (_) {}
      }
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Clear cache for an endpoint or by prefix (e.g. after mutations).
   * Pass exact path to clear one key, or path prefix to clear all matching (e.g. '/reports' clears all report caches).
   */
  async clearCacheForEndpoint(endpoint) {
    if (typeof window === 'undefined') return;
    try {
      const { clearCache, clearCacheByPrefix, generateCacheKey } = await getCacheUtils();
      if (!endpoint) return;
      // Clear exact key (no query string)
      const exactKey = generateCacheKey(endpoint.split('?')[0], {});
      clearCache(exactKey);
      // Clear all keys with this path prefix (covers query strings)
      clearCacheByPrefix(endpoint.split('?')[0]);
      logger.debug('Cache cleared for endpoint:', endpoint);
    } catch (error) {
      logCacheUnavailableOnce(error);
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
      skipRedirect
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
      skipRedirect
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

    // Deduplicate: if a refresh is already in progress, wait for it instead of starting another
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    const doRefresh = async () => {
      try {
        const response = await this.post('/auth/refresh', { refreshToken }, {}, true);

        if (response.success && response.data?.accessToken) {
          this.setToken(response.data.accessToken);
          if (response.data.refreshToken && typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          logger.info('Token refreshed successfully');
          return true;
        }
        logger.info('Token refresh failed:', response.error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
        }
        return false;
      } catch (error) {
        logger.error('Error refreshing token:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
        }
        return false;
      } finally {
        this._refreshPromise = null;
      }
    };

    this._refreshPromise = doRefresh();
    return this._refreshPromise;
  }
}

export const apiClient = new ApiClient();
