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

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

const currentLogLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : process.env.NODE_ENV === 'production' 
    ? LOG_LEVELS.WARN 
    : LOG_LEVELS.INFO;

// Correlation ID for request tracking
let correlationIdContext = null;

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
function setCorrelationId(id) {
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
function getCorrelationId() {
  return correlationIdContext || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format log message with enterprise features
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const levelName = LOG_LEVEL_NAMES[level];
  const correlationId = getCorrelationId();
  
  const logEntry = {
    timestamp,
    level: levelName,
    message,
    correlationId,
    service: 'clinic-tool',
    environment: process.env.NODE_ENV || 'development',
    ...meta,
  };

  // Add error tracking integration (Sentry, etc.)
  // Note: Sentry integration is optional - only works if @sentry/nextjs is installed
  if (level === LOG_LEVELS.ERROR && meta.error && typeof window === 'undefined') {
    // Server-side error tracking
    if (process.env.SENTRY_DSN) {
      try {
        // Sentry is marked as external in webpack config, so require won't fail at build time
        // It will only fail at runtime if the package is not installed
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sentry = require('@sentry/nextjs');
        if (Sentry && Sentry.captureException) {
          Sentry.captureException(meta.error, {
            level: 'error',
            tags: { correlationId },
            extra: meta,
          });
        }
      } catch (e) {
        // Sentry not available, silently continue
        // This is expected if @sentry/nextjs is not installed
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // Pretty print for development
  return `[${timestamp}] [${correlationId}] ${levelName}: ${message}${Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta, null, 2) : ''}`;
}

/**
 * Enterprise Logger instance with context support.
 * 
 * Provides structured logging methods with automatic correlation ID injection,
 * error tracking integration, and performance monitoring.
 * 
 * @namespace logger
 * @property {Function} error - Log error-level messages with optional error object
 * @property {Function} warn - Log warning-level messages
 * @property {Function} info - Log info-level messages
 * @property {Function} debug - Log debug-level messages (development only)
 * @property {Function} performance - Log performance metrics
 * @property {Function} database - Log database operations
 * @property {Function} api - Log API requests/responses
 */
const logger = {
  /**
   * Log an error-level message with optional error object.
   * 
   * Automatically integrates with error tracking services (Sentry) in production.
   * Includes full error details (message, stack, code, statusCode) in logs.
   * 
   * @method logger.error
   * @param {string} message - Error message description
   * @param {Error} [error=null] - Error object (optional)
   * @param {Object} [meta={}] - Additional metadata to include in log
   * @returns {void}
   * 
   * @example
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   logger.error('Risky operation failed', error, {
   *     userId: user.id,
   *     operation: 'riskyOperation'
   *   });
   * }
   * 
   * @example
   * logger.error('Database connection failed', dbError, {
   *   host: dbConfig.host,
   *   database: dbConfig.database
   * });
   * 
   * @note
   * Stack traces are only included in development mode for security.
   * In production, errors are sent to error tracking services.
   */
  error: (message, error = null, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const logMeta = {
        ...meta,
        ...(error && {
          error: {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            name: error.name,
            code: error.code,
            statusCode: error.statusCode,
          },
        }),
      };
      const formatted = formatLog(LOG_LEVELS.ERROR, message, logMeta);
      console.error(formatted);
      
      // Send to error tracking in production
      if (process.env.NODE_ENV === 'production' && error) {
        // Error tracking will be handled in formatLog
      }
    }
  },

  warn: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      const formatted = formatLog(LOG_LEVELS.WARN, message, meta);
      console.warn(formatted);
    }
  },

  info: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      const formatted = formatLog(LOG_LEVELS.INFO, message, meta);
      console.log(formatted);
    }
  },

  debug: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      const formatted = formatLog(LOG_LEVELS.DEBUG, message, meta);
      console.log(formatted);
    }
  },

  /**
   * Log performance metrics for operations.
   * 
   * Automatically logs warnings for slow operations (>1000ms).
   * Used for monitoring and identifying performance bottlenecks.
   * 
   * @method logger.performance
   * @param {string} operation - Name/identifier of the operation
   * @param {number} duration - Duration in milliseconds
   * @param {Object} [meta={}] - Additional metadata
   * @returns {void}
   * 
   * @example
   * const start = Date.now();
   * const result = await expensiveOperation();
   * logger.performance('expensiveOperation', Date.now() - start, {
   *   resultSize: result.length
   * });
   * 
   * @note
   * Operations taking >1000ms are automatically logged as warnings.
   */
  performance: (operation, duration, meta = {}) => {
    const perfMeta = {
      ...meta,
      operation,
      duration,
      unit: 'ms',
    };
    if (duration > 1000) {
      logger.warn(`Slow operation: ${operation}`, perfMeta);
    } else {
      logger.debug(`Performance: ${operation}`, perfMeta);
    }
  },

  /**
   * Log database operation with performance metrics.
   * 
   * Specialized logging for database operations with collection and duration tracking.
   * 
   * @method logger.database
   * @param {string} operation - Database operation type (find, insert, update, delete)
   * @param {string} collection - Collection/model name
   * @param {number} duration - Query duration in milliseconds
   * @param {Object} [meta={}] - Additional metadata (query, filters, etc.)
   * @returns {void}
   * 
   * @example
   * const start = Date.now();
   * const users = await User.find({ active: true }).lean();
   * logger.database('find', 'users', Date.now() - start, {
   *   filter: { active: true },
   *   count: users.length
   * });
   */
  database: (operation, collection, duration, meta = {}) => {
    logger.debug('Database Operation', {
      operation,
      collection,
      duration,
      ...meta,
    });
  },

  /**
   * Log API request/response with automatic severity detection.
   * 
   * Automatically determines log level based on status code and duration:
   * - 5xx errors: ERROR level
   * - 4xx errors: WARN level
   * - Slow requests (>2000ms): WARN level
   * - Normal requests: DEBUG level
   * 
   * @method logger.api
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} endpoint - API endpoint path
   * @param {number} statusCode - HTTP status code
   * @param {number} duration - Request duration in milliseconds
   * @param {Object} [meta={}] - Additional metadata (userId, tenantId, etc.)
   * @returns {void}
   * 
   * @example
   * const start = Date.now();
   * const response = await handler(req);
   * logger.api('GET', '/api/users', response.status, Date.now() - start, {
   *   userId: user.id,
   *   tenantId: user.tenantId
   * });
   * 
   * @note
   * Slow requests (>2000ms) are automatically logged as warnings for monitoring.
   */
  api: (method, endpoint, statusCode, duration, meta = {}) => {
    const apiMeta = {
      method,
      endpoint,
      statusCode,
      duration,
      ...meta,
    };
    // In development only log 5xx to keep terminal readable; use LOG_LEVEL=DEBUG for full API logs
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && statusCode < 500) return;

    if (statusCode >= 500) {
      logger.error(`API Error: ${method} ${endpoint}`, null, apiMeta);
    } else if (statusCode >= 400) {
      logger.warn(`API Warning: ${method} ${endpoint}`, apiMeta);
    } else if (duration > 2000) {
      logger.warn(`Slow API: ${method} ${endpoint}`, apiMeta);
    } else {
      logger.debug(`API: ${method} ${endpoint}`, apiMeta);
    }
  },
};

/**
 * Log incoming API request with user context.
 * 
 * Convenience function for logging HTTP requests with user information.
 * Extracts IP address, method, URL, and user context automatically.
 * 
 * @function logRequest
 * @param {Request} req - HTTP request object
 * @param {Object} [user=null] - User object with userId and tenantId
 * @returns {void}
 * 
 * @example
 * // In middleware
 * logRequest(req, user);
 * 
 * @note
 * IP address is extracted from various headers (x-forwarded-for, x-real-ip, etc.)
 * to support proxy/load balancer configurations.
 */
function logRequest(req, user = null) {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    userId: user?.userId || 'anonymous',
    tenantId: user?.tenantId || 'none',
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
  });
}

/**
 * Log API response with status code and duration.
 * 
 * Convenience function for logging HTTP responses after request completion.
 * 
 * @function logResponse
 * @param {Request} req - HTTP request object
 * @param {number} statusCode - HTTP status code
 * @param {number} [duration=null] - Request duration in milliseconds
 * @returns {void}
 * 
 * @example
 * const start = Date.now();
 * const response = await handler(req);
 * logResponse(req, response.status, Date.now() - start);
 */
function logResponse(req, statusCode, duration = null) {
  logger.debug('API Response', {
    method: req.method,
    url: req.url,
    statusCode,
    duration: duration ? `${duration}ms` : null,
  });
}

/**
 * Log database operation with performance metrics.
 * 
 * Convenience function for logging database operations with standardized format.
 * 
 * @function logDatabase
 * @param {string} operation - Database operation type
 * @param {string} collection - Collection/model name
 * @param {number} [duration=null] - Operation duration in milliseconds
 * @param {Object} [meta={}] - Additional metadata
 * @returns {void}
 * 
 * @example
 * const start = Date.now();
 * const result = await User.find().lean();
 * logDatabase('find', 'users', Date.now() - start, { count: result.length });
 */
function logDatabase(operation, collection, duration = null, meta = {}) {
  logger.debug('Database Operation', {
    operation,
    collection,
    duration: duration ? `${duration}ms` : null,
    ...meta,
  });
}

/**
 * Log security-related events for audit and monitoring.
 * 
 * Used for logging authentication failures, authorization violations,
 * suspicious activities, and other security events. Always logged at WARN level.
 * 
 * @function logSecurity
 * @param {string} event - Security event type (e.g., 'login_failed', 'unauthorized_access')
 * @param {Object} [user=null] - User object with userId and tenantId
 * @param {Object} [meta={}] - Additional event metadata (IP, userAgent, etc.)
 * @returns {void}
 * 
 * @example
 * // Log failed login attempt
 * logSecurity('login_failed', null, {
 *   email: attemptedEmail,
 *   ip: req.ip,
 *   reason: 'invalid_password'
 * });
 * 
 * @example
 * // Log unauthorized access attempt
 * logSecurity('unauthorized_access', user, {
 *   resource: '/api/admin/users',
 *   action: 'DELETE',
 *   ip: req.ip
 * });
 * 
 * @security
 * - All security events are logged for audit compliance
 * - Required for HIPAA/GDPR security monitoring
 * - Used for intrusion detection and alerting
 * 
 * @compliance
 * - HIPAA: Security incident logging
 * - GDPR: Access attempt tracking
 */
function logSecurity(event, user = null, meta = {}) {
  logger.warn('Security Event', {
    event,
    userId: user?.userId || 'unknown',
    tenantId: user?.tenantId || 'unknown',
    ...meta,
  });
}

// CommonJS export for Node runtime compatibility
module.exports = {
  logger,
  setCorrelationId,
  getCorrelationId,
  logRequest,
  logResponse,
  logDatabase,
  logSecurity,
};
