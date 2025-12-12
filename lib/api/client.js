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
        console.warn('Cache not available:', error);
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
        // Handle 401/403 (unauthorized/forbidden) - redirect to login only if not skipping redirect
        if ((response.status === 401 || response.status === 403) && !skipRedirect) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        return {
          success: false,
          error: data.error || {
            message: response.status === 403 ? 'Access denied' : response.status === 401 ? 'Unauthorized' : 'An error occurred',
            code: response.status === 403 ? 'FORBIDDEN' : response.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR',
          },
        };
      }

      // Cache successful GET responses
      if (typeof window !== 'undefined' && (options.method === 'GET' || !options.method) && data.success) {
        try {
          const { setCachedResponse, generateCacheKey } = await getCacheUtils();
          const cacheKey = generateCacheKey(endpoint, options.params);
          setCachedResponse(cacheKey, data);
        } catch (error) {
          // Cache not available, continue
          console.warn('Cache not available:', error);
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
      console.log('Cache cleared for endpoint:', endpoint);
    } catch (error) {
      console.warn('Cache not available:', error);
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
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, skipRedirect);
  }

  async put(endpoint, data, options, skipRedirect = false) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, skipRedirect);
  }

  async delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  setToken(token) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  async refreshToken() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    try {
      const response = await this.post('/auth/refresh', {
        refreshToken,
      }, {}, true); // Skip redirect during refresh

      if (response.success && response.data?.accessToken) {
        this.setToken(response.data.accessToken);
        // Also update refresh token if a new one is provided
        if (response.data.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.log('Token refresh failed:', response.error);
        // If refresh fails, clear tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
        }
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear refresh token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
      return false;
    }
  }
}

export const apiClient = new ApiClient();

