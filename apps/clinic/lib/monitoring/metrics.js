import { logger } from '../utils/logger.js';

/**
 * Enterprise Metrics Collection
 *
 * Collects and aggregates application metrics for monitoring, alerting, and performance analysis.
 * Tracks requests, database queries, cache operations, and errors with detailed statistics.
 *
 * Features:
 * - Request metrics (total, by status, by endpoint, duration percentiles)
 * - Database metrics (queries, slow queries, errors, by collection)
 * - Cache metrics (hits, misses, hit rate, errors)
 * - Error metrics (total, by type, recent errors)
 *
 * @module lib/monitoring/metrics
 * @since 1.0.0
 *
 * @example
 * import { recordRequest, getMetrics } from '@/lib/monitoring/metrics';
 *
 * // Record a request
 * recordRequest('/api/users', 'GET', 200, 150);
 *
 * // Get metrics snapshot
 * const metrics = getMetrics();
 * logger.info(metrics.requests.total);
 */

// In-memory metrics store (in production, send to monitoring service)
const metrics = {
  requests: {
    total: 0,
    byStatus: {},
    byEndpoint: {},
    duration: [],
  },
  database: {
    queries: 0,
    slowQueries: 0,
    errors: 0,
    byCollection: {},
  },
  cache: {
    hits: 0,
    misses: 0,
    errors: 0,
  },
  errors: {
    total: 0,
    byType: {},
    recent: [],
  },
};

/**
 * Record an API request metric for monitoring and analysis.
 *
 * Tracks request count, status codes, endpoint performance, and automatically
 * logs warnings for slow requests (>2000ms). Maintains last 1000 duration samples
 * for percentile calculations.
 *
 * @function recordRequest
 * @param {string} endpoint - API endpoint path (e.g., '/api/users')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {number} statusCode - HTTP status code (200, 404, 500, etc.)
 * @param {number} duration - Request duration in milliseconds
 * @returns {void}
 *
 * @example
 * const start = Date.now();
 * const response = await handler(req);
 * recordRequest('/api/users', 'GET', response.status, Date.now() - start);
 *
 * @performance
 * - Maintains rolling window of 1000 requests for percentile calculations
 * - Groups status codes by hundreds (200, 300, 400, 500) for aggregation
 * - Automatically logs slow requests for alerting
 *
 * @note
 * Should be called for every API request to maintain accurate metrics.
 * Duration should be measured from request start to response completion.
 */
export function recordRequest(endpoint, method, statusCode, duration) {
  metrics.requests.total++;

  // Status code tracking
  const statusGroup = Math.floor(statusCode / 100) * 100;
  metrics.requests.byStatus[statusGroup] = (metrics.requests.byStatus[statusGroup] || 0) + 1;

  // Endpoint tracking
  const key = `${method} ${endpoint}`;
  if (!metrics.requests.byEndpoint[key]) {
    metrics.requests.byEndpoint[key] = { count: 0, totalDuration: 0, errors: 0 };
  }
  metrics.requests.byEndpoint[key].count++;
  metrics.requests.byEndpoint[key].totalDuration += duration;

  if (statusCode >= 400) {
    metrics.requests.byEndpoint[key].errors++;
  }

  // Duration tracking (keep last 1000)
  metrics.requests.duration.push(duration);
  if (metrics.requests.duration.length > 1000) {
    metrics.requests.duration.shift();
  }

  // Log slow requests
  if (duration > 2000) {
    logger.warn('Slow request detected', {
      endpoint,
      method,
      duration,
      statusCode,
    });
  }
}

/**
 * Record a database query metric for performance monitoring.
 *
 * Tracks query count, duration, success/failure rates, and automatically
 * identifies slow queries (>1000ms) for optimization. Maintains per-collection
 * statistics for detailed analysis.
 *
 * @function recordDatabaseQuery
 * @param {string} collection - Collection/model name (e.g., 'users', 'appointments')
 * @param {number} duration - Query execution time in milliseconds
 * @param {boolean} [success=true] - Whether the query succeeded
 * @returns {void}
 *
 * @example
 * const start = Date.now();
 * try {
 *   const users = await User.find().lean();
 *   recordDatabaseQuery('users', Date.now() - start, true);
 * } catch (error) {
 *   recordDatabaseQuery('users', Date.now() - start, false);
 * }
 *
 * @performance
 * - Tracks slow queries (>1000ms) separately for optimization focus
 * - Maintains per-collection statistics for identifying problem areas
 * - Logs slow queries automatically for immediate attention
 *
 * @note
 * Should be called for every database operation to maintain accurate metrics.
 * Use with query optimizer utilities for automatic tracking.
 */
export function recordDatabaseQuery(collection, duration, success = true) {
  metrics.database.queries++;

  if (!success) {
    metrics.database.errors++;
  }

  if (!metrics.database.byCollection[collection]) {
    metrics.database.byCollection[collection] = {
      count: 0,
      totalDuration: 0,
      errors: 0,
    };
  }

  metrics.database.byCollection[collection].count++;
  metrics.database.byCollection[collection].totalDuration += duration;

  if (!success) {
    metrics.database.byCollection[collection].errors++;
  }

  // Track slow queries
  if (duration > 1000) {
    metrics.database.slowQueries++;
    logger.warn('Slow database query', {
      collection,
      duration,
    });
  }
}

/**
 * Record a cache operation (hit, miss, or error) for cache performance analysis.
 *
 * Tracks cache hit/miss rates to measure cache effectiveness. High miss rates
 * indicate cache configuration issues or cache eviction problems.
 *
 * @function recordCacheOperation
 * @param {string} type - Operation type: 'hit', 'miss', or 'error'
 * @param {boolean} [success=true] - Whether the operation succeeded
 * @returns {void}
 *
 * @example
 * try {
 *   const cached = await getCache(key);
 *   recordCacheOperation(cached ? 'hit' : 'miss', true);
 * } catch (error) {
 *   recordCacheOperation('error', false);
 * }
 *
 * @performance
 * - Hit rate = hits / (hits + misses) - higher is better
 * - Low hit rates indicate cache configuration issues
 * - Errors indicate cache service problems
 *
 * @note
 * Should be called for every cache operation to maintain accurate metrics.
 */
export function recordCacheOperation(type, success = true) {
  if (type === 'hit') {
    metrics.cache.hits++;
  } else if (type === 'miss') {
    metrics.cache.misses++;
  }

  if (!success) {
    metrics.cache.errors++;
  }
}

/**
 * Record an error for error tracking and analysis.
 *
 * Tracks error count, types, and maintains recent error log for debugging.
 * Essential for identifying error patterns and monitoring application health.
 *
 * @function recordError
 * @param {Error} error - Error object to record
 * @param {Object} [context={}] - Additional context (userId, endpoint, etc.)
 * @returns {void}
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   recordError(error, {
 *     userId: user.id,
 *     operation: 'riskyOperation',
 *     endpoint: '/api/risky'
 *   });
 *   throw error;
 * }
 *
 * @note
 * Maintains last 100 errors for recent error analysis.
 * Error type is extracted from error.name or constructor name.
 */
export function recordError(error, context = {}) {
  metrics.errors.total++;

  const errorType = error.name || error.constructor?.name || 'UnknownError';
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;

  // Keep last 100 errors
  metrics.errors.recent.push({
    type: errorType,
    message: error.message,
    timestamp: new Date().toISOString(),
    context,
  });

  if (metrics.errors.recent.length > 100) {
    metrics.errors.recent.shift();
  }
}

/**
 * Get a comprehensive snapshot of all collected metrics.
 *
 * Returns aggregated metrics with calculated statistics including averages,
 * percentiles (p95, p99), error rates, and hit rates. Used for monitoring
 * dashboards, health checks, and performance analysis.
 *
 * @function getMetrics
 * @returns {Object} Comprehensive metrics snapshot
 * @returns {Object} returns.requests - Request metrics
 * @returns {number} returns.requests.total - Total request count
 * @returns {Object} returns.requests.byStatus - Requests grouped by status code (200, 300, 400, 500)
 * @returns {Array} returns.requests.byEndpoint - Per-endpoint statistics
 * @returns {Object} returns.requests.duration - Duration statistics (avg, p95, p99)
 * @returns {Object} returns.database - Database metrics
 * @returns {number} returns.database.queries - Total query count
 * @returns {number} returns.database.slowQueries - Count of slow queries (>1000ms)
 * @returns {number} returns.database.errors - Total query errors
 * @returns {Array} returns.database.byCollection - Per-collection statistics
 * @returns {Object} returns.cache - Cache metrics
 * @returns {number} returns.cache.hits - Cache hit count
 * @returns {number} returns.cache.misses - Cache miss count
 * @returns {number} returns.cache.hitRate - Cache hit rate (0-1)
 * @returns {number} returns.cache.errors - Cache error count
 * @returns {Object} returns.errors - Error metrics
 * @returns {number} returns.errors.total - Total error count
 * @returns {Object} returns.errors.byType - Errors grouped by type
 * @returns {Array} returns.errors.recent - Last 10 errors with context
 * @returns {string} returns.timestamp - ISO timestamp of snapshot
 *
 * @example
 * // Get metrics for health check
 * const metrics = getMetrics();
 *
 * if (metrics.errors.total > 100) {
 *   alert('High error rate detected');
 * }
 *
 * if (metrics.cache.hitRate < 0.5) {
 *   logger.warn('Low cache hit rate', { hitRate: metrics.cache.hitRate });
 * }
 *
 * @performance
 * - Calculates percentiles from rolling window of 1000 requests
 * - Percentiles help identify tail latency issues
 * - All calculations are O(n) or better
 *
 * @note
 * Percentiles (p95, p99) are calculated from the last 1000 duration samples.
 * For accurate percentiles, ensure sufficient request volume.
 */
export function getMetrics() {
  // Calculate averages
  const avgRequestDuration =
    metrics.requests.duration.length > 0
      ? metrics.requests.duration.reduce((a, b) => a + b, 0) / metrics.requests.duration.length
      : 0;

  const p95Duration =
    metrics.requests.duration.length > 0
      ? metrics.requests.duration.sort((a, b) => a - b)[
          Math.floor(metrics.requests.duration.length * 0.95)
        ]
      : 0;

  const p99Duration =
    metrics.requests.duration.length > 0
      ? metrics.requests.duration.sort((a, b) => a - b)[
          Math.floor(metrics.requests.duration.length * 0.99)
        ]
      : 0;

  return {
    requests: {
      total: metrics.requests.total,
      byStatus: metrics.requests.byStatus,
      byEndpoint: Object.entries(metrics.requests.byEndpoint).map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgDuration: data.totalDuration / data.count,
        errors: data.errors,
        errorRate: data.errors / data.count,
      })),
      duration: {
        avg: avgRequestDuration,
        p95: p95Duration,
        p99: p99Duration,
      },
    },
    database: {
      queries: metrics.database.queries,
      slowQueries: metrics.database.slowQueries,
      errors: metrics.database.errors,
      byCollection: Object.entries(metrics.database.byCollection).map(([collection, data]) => ({
        collection,
        count: data.count,
        avgDuration: data.totalDuration / data.count,
        errors: data.errors,
      })),
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses || 1),
      errors: metrics.cache.errors,
    },
    errors: {
      total: metrics.errors.total,
      byType: metrics.errors.byType,
      recent: metrics.errors.recent.slice(-10), // Last 10 errors
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Reset all metrics to initial state.
 *
 * Clears all collected metrics. Primarily used for testing to ensure
 * clean state between test runs. Should NOT be called in production.
 *
 * @function resetMetrics
 * @returns {void}
 *
 * @example
 * // In test setup
 * beforeEach(() => {
 *   resetMetrics();
 * });
 *
 * @warning
 * **DO NOT USE IN PRODUCTION** - This will clear all monitoring data.
 * Only use in test environments.
 */
export function resetMetrics() {
  Object.keys(metrics).forEach((key) => {
    if (Array.isArray(metrics[key])) {
      metrics[key] = [];
    } else if (typeof metrics[key] === 'object') {
      metrics[key] = {};
    } else {
      metrics[key] = 0;
    }
  });
}
