/**
 * Centralized Error Handling Utility (standard design)
 *
 * Single source for: classification, user messages, safe access, retry.
 * Used by: ErrorBoundary, app/error.jsx, useErrorHandler, API middleware.
 *
 * Error types: RUNTIME, NETWORK, VALIDATION, AUTHENTICATION, AUTHORIZATION,
 * NOT_FOUND, SERVER, DATABASE, UNKNOWN.
 *
 * @module lib/utils/error-handler
 */

import { logger } from './logger';

/**
 * Error types classification
 */
export const ErrorTypes = {
  RUNTIME: 'RUNTIME_ERROR',
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Classify error type based on error object
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export function classifyError(error) {
  if (!error) return ErrorTypes.UNKNOWN;

  const msg = typeof error.message === 'string' ? error.message : '';
  const code = error.code ?? error.status ?? error.statusCode;

  // Network errors (check before generic TypeError)
  if (
    error.name === 'NetworkError' ||
    (error.name === 'TypeError' && msg.includes('fetch')) ||
    msg.includes('network') ||
    msg.includes('Failed to fetch') ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT'
  ) {
    return ErrorTypes.NETWORK;
  }

  // Authentication errors
  if (
    error.statusCode === 401 ||
    error.status === 401 ||
    code === 401 ||
    error.name === 'UnauthorizedError' ||
    msg.includes('unauthorized') ||
    msg.includes('authentication')
  ) {
    return ErrorTypes.AUTHENTICATION;
  }

  // Authorization errors
  if (
    error.statusCode === 403 ||
    error.status === 403 ||
    code === 403 ||
    error.name === 'ForbiddenError' ||
    msg.includes('forbidden') ||
    msg.includes('permission')
  ) {
    return ErrorTypes.AUTHORIZATION;
  }

  // Not found errors
  if (
    error.statusCode === 404 ||
    error.status === 404 ||
    code === 404 ||
    error.name === 'NotFoundError' ||
    msg.includes('not found')
  ) {
    return ErrorTypes.NOT_FOUND;
  }

  // Validation errors
  if (
    error.name === 'ValidationError' ||
    error.name === 'ZodError' ||
    error.statusCode === 400 ||
    error.status === 400 ||
    code === 400 ||
    msg.includes('validation') ||
    msg.includes('invalid')
  ) {
    return ErrorTypes.VALIDATION;
  }

  // Server errors
  const status = error.statusCode ?? error.status;
  if ((typeof status === 'number' && status >= 500) || error.name === 'ServerError') {
    return ErrorTypes.SERVER;
  }

  // Database errors
  if (
    error.name === 'MongoError' ||
    error.name === 'MongooseError' ||
    error.code === 11000 ||
    msg.includes('database') ||
    msg.includes('connection')
  ) {
    return ErrorTypes.DATABASE;
  }

  // Runtime errors
  if (
    error instanceof TypeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError ||
    error.name === 'TypeError' ||
    error.name === 'ReferenceError'
  ) {
    return ErrorTypes.RUNTIME;
  }

  return ErrorTypes.UNKNOWN;
}

/**
 * Detects chunk-load / stale-build errors that are recoverable via hard refresh.
 * Used by error boundaries and error page to auto-refresh instead of showing error UI.
 * @param {Error|{ message?: string }} error - Error object
 * @returns {boolean}
 */
export function isChunkOrStaleError(error) {
  const msg = error?.message ?? (typeof error === 'string' ? error : '');
  if (!msg || typeof msg !== 'string') return false;
  const s = msg.toLowerCase();
  return (
    s.includes("reading 'call'") ||
    s.includes('chunkloaderror') ||
    (s.includes('loading chunk') && s.includes('failed')) ||
    s.includes('loading css chunk') ||
    s.includes('failed to fetch dynamically imported module') ||
    s.includes('import promise')
  );
}

/**
 * Attempts a hard refresh when chunk/stale errors occur. Uses sessionStorage to avoid loops.
 * Unregisters service workers first to bypass SW cache and fetch fresh chunks.
 * Call only when isChunkOrStaleError(error) is true.
 * @returns {boolean} True if refresh was triggered
 */
export function tryChunkRecovery() {
  if (typeof window === 'undefined') return false;
  try {
    const KEY = 'chunkReloadAttempted';
    const COOLDOWN_MS = 10000;
    const raw = sessionStorage.getItem(KEY);
    const last = raw ? parseInt(raw, 10) : 0;
    if (Date.now() - last < COOLDOWN_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));

    const doReload = () => window.location.reload();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(doReload)
        .catch(doReload);
    } else {
      doReload();
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} fallback - Fallback message
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error, fallback = 'An unexpected error occurred') {
  if (!error) return fallback;

  const errorType = classifyError(error);

  const errMsg = error.message;
  if (error.userMessage) return error.userMessage;
  if (typeof errMsg === 'string' && !errMsg.includes('Error:') && errMsg.length < 200) {
    return errMsg;
  }

  // Type-specific messages
  const messages = {
    [ErrorTypes.NETWORK]:
      'Network connection failed. Please check your internet connection and try again.',
    [ErrorTypes.AUTHENTICATION]: 'Your session has expired. Please log in again.',
    [ErrorTypes.AUTHORIZATION]: 'You do not have permission to perform this action.',
    [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
    [ErrorTypes.SERVER]: 'Server error occurred. Please try again later.',
    [ErrorTypes.DATABASE]: 'Database error occurred. Please try again later.',
    [ErrorTypes.RUNTIME]: 'An error occurred. Please refresh the page and try again.',
    [ErrorTypes.UNKNOWN]: fallback,
  };

  return messages[errorType] || fallback;
}

/**
 * Safe function wrapper - catches and handles errors
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Options
 * @param {string} options.context - Context for logging
 * @param {Function} options.onError - Custom error handler
 * @param {*} options.fallback - Fallback return value
 * @returns {Function} Wrapped function
 */
export function safeWrapper(fn, options = {}) {
  const { context = 'Unknown', onError, fallback } = options;

  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorType = classifyError(error);
      logger.error(`Error in ${context}`, error, {
        errorType,
        args: args.length > 0 ? JSON.stringify(args).substring(0, 200) : undefined,
      });

      if (onError) {
        return onError(error, ...args);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    }
  };
}

/**
 * Safe value accessor - prevents undefined/null errors
 * @param {Function} accessor - Function that accesses nested properties
 * @param {*} fallback - Fallback value
 * @returns {*} Value or fallback
 */
export function safeAccess(accessor, fallback = null) {
  try {
    const value = accessor();
    return value !== undefined && value !== null ? value : fallback;
  } catch (error) {
    logger.warn('Safe access failed', { error: error.message });
    return fallback;
  }
}

/**
 * Safe async operation wrapper
 * @param {Promise} promise - Promise to wrap
 * @param {Object} options - Options
 * @returns {Promise} Wrapped promise with error handling
 */
export async function safeAsync(promise, options = {}) {
  const { fallback, context = 'Async operation' } = options;

  try {
    return await promise;
  } catch (error) {
    const errorType = classifyError(error);
    logger.error(`Error in ${context}`, error, { errorType });

    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

/**
 * Safe translation wrapper
 * @param {Function} t - Translation function
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text
 * @returns {string} Translated text or fallback
 */
export function safeTranslate(t, key, fallback = key) {
  if (!t || typeof t !== 'function') {
    logger.warn('Invalid translation function', { key });
    return fallback;
  }

  if (!key) {
    return fallback;
  }

  try {
    const translation = t(key);
    // If translation returns the key itself, it means translation not found
    if (translation === key && key.includes('.')) {
      return fallback;
    }
    return translation || fallback;
  } catch (error) {
    logger.warn('Translation error', { key, error: error.message });
    return fallback;
  }
}

/**
 * Safe array operations
 */
export const safeArray = {
  /**
   * Safe map operation
   */
  map: (array, mapper, fallback = []) => {
    if (!Array.isArray(array)) {
      logger.warn('safeArray.map: Not an array', { type: typeof array });
      return fallback;
    }
    try {
      return array.map(mapper);
    } catch (error) {
      logger.error('safeArray.map error', error);
      return fallback;
    }
  },

  /**
   * Safe filter operation
   */
  filter: (array, predicate, fallback = []) => {
    if (!Array.isArray(array)) {
      logger.warn('safeArray.filter: Not an array', { type: typeof array });
      return fallback;
    }
    try {
      return array.filter(predicate);
    } catch (error) {
      logger.error('safeArray.filter error', error);
      return fallback;
    }
  },

  /**
   * Safe find operation
   */
  find: (array, predicate, fallback = null) => {
    if (!Array.isArray(array)) {
      return fallback;
    }
    try {
      return array.find(predicate) || fallback;
    } catch (error) {
      logger.error('safeArray.find error', error);
      return fallback;
    }
  },
};

/**
 * Safe object property access
 * @param {Object} obj - Object to access
 * @param {string} path - Property path (e.g., 'user.profile.name')
 * @param {*} fallback - Fallback value
 * @returns {*} Property value or fallback
 */
export function safeGet(obj, path, fallback = null) {
  if (!obj || !path) return fallback;

  try {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return fallback;
      }
      value = value[key];
    }

    return value !== undefined && value !== null ? value : fallback;
  } catch (error) {
    logger.warn('safeGet error', { path, error: error.message });
    return fallback;
  }
}

/**
 * Error handler for React components
 * @param {Error} error - Error object
 * @param {Object} errorInfo - Error info from React
 * @param {string} componentName - Component name
 */
export function handleComponentError(error, errorInfo, componentName = 'Unknown') {
  const errorType = classifyError(error);

  logger.error(`Component error in ${componentName}`, error, {
    errorType,
    componentStack: errorInfo?.componentStack,
  });

  // Return error details for ErrorBoundary
  return {
    error,
    errorType,
    userMessage: getUserFriendlyMessage(error),
    componentName,
  };
}

/**
 * Retry wrapper for failed operations
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.delay - Delay between retries (ms)
 * @param {Function} options.shouldRetry - Function to determine if should retry
 * @returns {Promise} Result of function
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    shouldRetry = (error) => {
      const type = classifyError(error);
      return type === ErrorTypes.NETWORK || type === ErrorTypes.SERVER;
    },
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
    }
  }

  throw lastError;
}

/**
 * Default export with all utilities
 */
export default {
  classifyError,
  getUserFriendlyMessage,
  isChunkOrStaleError,
  tryChunkRecovery,
  safeWrapper,
  safeAccess,
  safeAsync,
  safeTranslate,
  safeArray,
  safeGet,
  handleComponentError,
  withRetry,
  ErrorTypes,
};
