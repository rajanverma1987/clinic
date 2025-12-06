/**
 * API Client
 * Centralized API request handler with authentication
 */

class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  async request(endpoint, options = {}, skipRedirect = false) {
    const token = this.getToken();

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
    if (!refreshToken) return false;

    const response = await this.post('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data?.accessToken) {
      this.setToken(response.data.accessToken);
      return true;
    }

    return false;
  }
}

export const apiClient = new ApiClient();

