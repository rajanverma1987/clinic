/**
 * React Hook for Error Handling
 *
 * Provides error handling utilities for React components
 *
 * @module hooks/useErrorHandler
 */

import {
  classifyError,
  ErrorTypes,
  getUserFriendlyMessage,
  safeAsync,
  safeTranslate as safeTranslateUtil,
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { showError } from '@/lib/utils/toast';
import { useCallback } from 'react';

/**
 * Custom hook for error handling in React components
 * @param {Object} options - Options
 * @param {Function} options.onError - Custom error handler
 * @param {boolean} options.showToast - Show toast notification on error
 * @param {Function} options.t - Translation function
 * @returns {Object} Error handling utilities
 */
export function useErrorHandler(options = {}) {
  const { onError, showToast = true, t } = options;

  /**
   * Handle error with user-friendly message
   */
  const handleError = useCallback(
    (error, context = 'Operation') => {
      const errorType = classifyError(error);
      const userMessage = getUserFriendlyMessage(error);

      // Log error
      logger.error(`Error in ${context}`, error, { errorType });

      // Show toast if enabled
      if (showToast) {
        showError(userMessage);
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error, errorType, userMessage);
      }

      return { errorType, userMessage };
    },
    [onError, showToast],
  );

  /**
   * Safe async operation wrapper
   */
  const safeAsyncOperation = useCallback(
    async (promise, context = 'Async operation') => {
      return safeAsync(promise, {
        context,
        fallback: null,
      }).catch((error) => {
        handleError(error, context);
        return null;
      });
    },
    [handleError],
  );

  /**
   * Safe translation wrapper
   */
  const safeTranslate = useCallback(
    (key, fallback = key) => {
      if (!t) return fallback;
      return safeTranslateUtil(t, key, fallback);
    },
    [t],
  );

  /**
   * Wrap function with error handling
   */
  const wrapWithErrorHandling = useCallback(
    (fn, context = 'Function') => {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, context);
          throw error;
        }
      };
    },
    [handleError],
  );

  return {
    handleError,
    safeAsyncOperation,
    safeTranslate,
    wrapWithErrorHandling,
    ErrorTypes,
  };
}
