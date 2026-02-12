import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

const DEFAULT_ERROR = 'An unexpected error occurred';

export async function fetchData(endpoint, options = {}) {
  try {
    const response = await apiClient.request(endpoint, options);

    if (response?.success) {
      return {
        success: true,
        data: response.data ?? null,
      };
    }

    const errorPayload = response?.error || null;
    const message = errorPayload?.message || DEFAULT_ERROR;

    if (errorPayload) {
      logger.warn('API returned an error response', {
        endpoint,
        code: errorPayload.code,
        message: errorPayload.message,
      });
    }

    return {
      success: false,
      error: {
        ...errorPayload,
        message,
      },
    };
  } catch (error) {
    logger.error('fetchData failed', error, { endpoint });
    return {
      success: false,
      error: {
        message: error?.message || DEFAULT_ERROR,
        code: 'NETWORK_ERROR',
      },
    };
  }
}
