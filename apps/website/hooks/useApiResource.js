'use client';

import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger';
import { showToast } from '@/lib/utils/toast';
import { useCallback, useEffect, useState } from 'react';

export function useApiResource(fetcher, options = {}) {
  const { t } = useI18n();
  const {
    manual = false,
    toastOnError = true,
    initialData = null,
    deps = [],
    preserveDataOnError = true,
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!manual);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(...args);
        if (result?.success) {
          setData(result.data);
          return result;
        }

        const message =
          result?.error?.userMessage ||
          result?.error?.message ||
          t('errors.generic', 'An unexpected error occurred');

        if (toastOnError) {
          showToast(message, 'error');
        }

        setError(message);
        setData((prev) => (preserveDataOnError ? prev : initialData));
        return result;
      } catch (err) {
        logger.error('useApiResource execution failed', err);
        const message = t('errors.networkError', 'Network error. Please try again.');

        if (toastOnError) {
          showToast(message, 'error');
        }

        setError(message);
        setData((prev) => (preserveDataOnError ? prev : initialData));
        return { success: false, error: { message } };
      } finally {
        setLoading(false);
      }
    },
    [fetcher, initialData, preserveDataOnError, t, toastOnError],
  );

  useEffect(() => {
    if (!manual) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, execute, ...deps]);

  return {
    data,
    error,
    loading,
    refetch: execute,
  };
}
