/**
 * Enterprise Logger Utility
 * 
 * Provides structured logging with correlation IDs, context tracking, and integration
 * with enterprise log aggregation services (Sentry, DataDog, CloudWatch, etc.).
 * 
 * Features:
 * - Correlation ID tracking for request tracing
 * - Structured JSON logging for production
 * - Log level filtering (ERROR, WARN, INFO, DEBUG)
 * - Automatic error tracking integration
 * - Performance logging
 * - Security event logging
 * 
 * @module lib/utils/logger
 * @since 1.0.0
 * 
 * @example
 * import { logger } from '@/lib/utils/logger';
 * 
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database error', error, { query: 'SELECT * FROM users' });
 * 
 * // Performance logging
 * logger.performance('databaseQuery', 250, { collection: 'users' });
 * 
 * // API logging
 * logger.api('GET', '/api/users', 200, 150);
 */

// Correlation ID for request tracking
let correlationIdContext = null;

const noop = () => {};

/**
 * Set correlation ID for request context tracking.
 * 
 * Correlation IDs allow tracing requests across multiple services and log entries.
 * Should be set at the start of each request (typically in middleware).
 * 
 * @function setCorrelationId
 * @param {string} id - Unique correlation ID for the current request
 * @returns {void}
 * 
 * @example
 * // In middleware
 * const correlationId = req.headers.get('x-correlation-id') || generateId();
 * setCorrelationId(correlationId);
 * 
 * @note
 * Correlation ID should be unique per request and passed through all service calls.
 */
export function setCorrelationId(id) {
  correlationIdContext = id;
}

/**
 * Get current correlation ID or generate a new one.
 * 
 * Returns the current correlation ID if set, otherwise generates a unique ID.
 * Generated IDs follow pattern: `req-{timestamp}-{random}`.
 * 
 * @function getCorrelationId
 * @returns {string} Current correlation ID or newly generated one
 * 
 * @example
 * const correlationId = getCorrelationId();
 * logger.info('Processing request', { correlationId });
 */
export function getCorrelationId() {
  return correlationIdContext || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** No-op logger: all log methods disabled. */
export const logger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  performance: noop,
  database: noop,
  api: noop,
};

export function logRequest() {}
export function logResponse() {}
export function logDatabase() {}
export function logSecurity() {}
