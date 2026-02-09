/**
 * Enterprise Helper Utilities
 * 
 * Provides common enterprise patterns and utilities for building robust, scalable applications.
 * Includes retry logic, circuit breakers, caching strategies, batch processing, and data sanitization.
 * 
 * @module lib/utils/enterprise-helpers
 * @since 1.0.0
 */

import { logger } from './logger.js';
import CacheManager from '@/lib/cache/cache-manager.js';

/**
 * Default retry configuration for exponential backoff strategy.
 * 
 * @constant {Object} DEFAULT_RETRY_CONFIG
 * @property {number} maxAttempts - Maximum number of retry attempts (default: 3)
 * @property {number} initialDelay - Initial delay in milliseconds before first retry (default: 100ms)
 * @property {number} maxDelay - Maximum delay cap in milliseconds (default: 5000ms)
 * @property {number} backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @property {string[]} retryableErrors - List of error codes that should trigger retry
 */
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 5000, // ms
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
};

/**
 * Retry a function with exponential backoff strategy.
 * 
 * Implements exponential backoff retry pattern for handling transient failures.
 * Only retries on network-related errors by default. Non-retryable errors are immediately thrown.
 * 
 * @async
 * @function retryWithBackoff
 * @param {Function} fn - Async function to retry. Should return a Promise.
 * @param {Object} [config={}] - Retry configuration options
 * @param {number} [config.maxAttempts=3] - Maximum number of retry attempts
 * @param {number} [config.initialDelay=100] - Initial delay in milliseconds
 * @param {number} [config.maxDelay=5000] - Maximum delay cap in milliseconds
 * @param {number} [config.backoffMultiplier=2] - Exponential backoff multiplier
 * @param {string[]} [config.retryableErrors] - Array of error codes to retry on
 * @returns {Promise<*>} The result of the function if successful
 * @throws {Error} The last error encountered if all retries fail
 * 
 * @example
 * // Retry a database query
 * const result = await retryWithBackoff(
 *   () => db.query('SELECT * FROM users'),
 *   { maxAttempts: 5, initialDelay: 200 }
 * );
 * 
 * @example
 * // Retry an API call
 * const data = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error('API Error');
 *     return response.json();
 *   },
 *   { maxAttempts: 3 }
 * );
 * 
 * @performance
 * - Exponential backoff prevents overwhelming failing services
 * - Only retries on transient errors to avoid unnecessary delays
 * 
 * @security
 * - Does not retry on authentication/authorization errors
 * - Logs all retry attempts for audit purposes
 */
export async function retryWithBackoff(fn, config = {}) {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = retryConfig.retryableErrors.some(
        code => error.code === code || error.message?.includes(code)
      );
      
      if (!isRetryable || attempt === retryConfig.maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );
      
      logger.warn(`Retry attempt ${attempt}/${retryConfig.maxAttempts} after ${delay}ms`, {
        error: error.message,
        code: error.code,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * In-memory store for circuit breaker states.
 * In production, consider using Redis for distributed circuit breakers.
 * 
 * @private
 * @type {Map<string, Object>}
 */
const circuitBreakers = new Map();

/**
 * Create a circuit breaker to prevent cascading failures.
 * 
 * Implements the Circuit Breaker pattern to protect against repeated failures.
 * States: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery).
 * 
 * @function createCircuitBreaker
 * @param {string} name - Unique name for the circuit breaker instance
 * @param {Object} [options={}] - Circuit breaker configuration
 * @param {number} [options.failureThreshold=5] - Number of failures before opening circuit
 * @param {number} [options.resetTimeout=60000] - Time in ms before attempting to reset (default: 60s)
 * @param {number} [options.timeout=30000] - Operation timeout in ms (default: 30s)
 * @returns {Function} Circuit breaker function that wraps async operations
 * 
 * @example
 * // Create circuit breaker for external API
 * const apiBreaker = createCircuitBreaker('external-api', {
 *   failureThreshold: 5,
 *   resetTimeout: 60000
 * });
 * 
 * // Use it to protect API calls
 * try {
 *   const data = await apiBreaker(() => fetchExternalAPI());
 * } catch (error) {
 *   // Handle circuit open or operation failure
 * }
 * 
 * @example
 * // Database operation protection
 * const dbBreaker = createCircuitBreaker('database', {
 *   failureThreshold: 10,
 *   timeout: 5000
 * });
 * 
 * const users = await dbBreaker(() => User.find().exec());
 * 
 * @performance
 * - Prevents cascading failures by failing fast when service is down
 * - Reduces load on failing services during recovery
 * 
 * @security
 * - Timeout prevents hanging operations
 * - Logs all state transitions for monitoring
 * 
 * @see {@link https://martinfowler.com/bliki/CircuitBreaker.html|Martin Fowler - Circuit Breaker}
 */
export function createCircuitBreaker(name, options = {}) {
  const {
    failureThreshold = 5,
    resetTimeout = 60000, // 1 minute
    timeout = 30000, // 30 seconds
  } = options;
  
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, {
      failures: 0,
      lastFailureTime: null,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
    });
  }
  
  const breaker = circuitBreakers.get(name);
  
  return async (fn) => {
    const now = Date.now();
    
    // Check if we should attempt to reset
    if (breaker.state === 'OPEN') {
      if (now - breaker.lastFailureTime > resetTimeout) {
        breaker.state = 'HALF_OPEN';
        logger.info(`Circuit breaker ${name} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${name} is OPEN. Service unavailable.`);
      }
    }
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        ),
      ]);
      
      // Success - reset failure count
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        logger.info(`Circuit breaker ${name} reset to CLOSED state`);
      }
      breaker.failures = 0;
      
      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailureTime = now;
      
      if (breaker.failures >= failureThreshold) {
        breaker.state = 'OPEN';
        logger.error(`Circuit breaker ${name} opened due to ${breaker.failures} failures`, error);
      }
      
      throw error;
    }
  };
}

/**
 * Cache with fallback pattern for resilient data fetching.
 * 
 * Attempts to retrieve data from cache first. On cache miss or error,
 * fetches fresh data and stores it in cache. Gracefully handles cache failures.
 * 
 * @async
 * @function cacheWithFallback
 * @param {string} key - Cache key identifier
 * @param {Function} fetchFn - Async function to fetch fresh data if cache miss
 * @param {number} [ttlSeconds=300] - Time-to-live for cached data in seconds (default: 5 minutes)
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache (can disable for testing)
 * @param {string} [options.cachePrefix='cache'] - Prefix for cache key namespace
 * @returns {Promise<*>} Cached data or freshly fetched data
 * 
 * @example
 * // Cache user data with 10 minute TTL
 * const user = await cacheWithFallback(
 *   `user:${userId}`,
 *   () => User.findById(userId).lean(),
 *   600, // 10 minutes
 *   { cachePrefix: 'users' }
 * );
 * 
 * @example
 * // Cache API response
 * const data = await cacheWithFallback(
 *   'api:reports:dashboard',
 *   () => fetchDashboardData(tenantId),
 *   300,
 *   { cachePrefix: `tenant:${tenantId}` }
 * );
 * 
 * @performance
 * - Reduces database/API load through intelligent caching
 * - Non-blocking cache writes prevent request delays
 * - Graceful degradation ensures service availability
 * 
 * @security
 * - Cache keys are namespaced to prevent collisions
 * - Sensitive data should have shorter TTLs
 * 
 * @note
 * Cache write failures are logged but don't block the response.
 * This ensures service availability even if cache is temporarily unavailable.
 */
export async function cacheWithFallback(key, fetchFn, ttlSeconds = 300, options = {}) {
  const { useCache = true, cachePrefix = 'cache' } = options;
  
  if (useCache) {
    try {
      // Try to get from cache
      const cached = await CacheManager.get(cachePrefix, key);
      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return cached;
      }
    } catch (error) {
      logger.warn(`Cache read error for ${key}, falling back to fetch`, { error: error.message });
    }
  }
  
  // Cache miss or error - fetch fresh data
  logger.debug(`Cache miss: ${key}`);
  const data = await fetchFn();
  
  // Store in cache (don't await to avoid blocking)
  if (useCache) {
    CacheManager.set(cachePrefix, data, ttlSeconds, key).catch(error => {
      logger.warn(`Cache write error for ${key}`, { error: error.message });
    });
  }
  
  return data;
}

/**
 * Process items in batches with controlled concurrency.
 * 
 * Processes items in parallel batches to optimize throughput while preventing
 * resource exhaustion. Returns both successful results and errors for comprehensive handling.
 * 
 * @async
 * @function batchWithConcurrency
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Async function to process each item. Receives item as parameter.
 * @param {number} [concurrency=5] - Maximum number of concurrent operations (default: 5)
 * @returns {Promise<Object>} Object containing results and errors
 * @returns {Array} returns.results - Successfully processed items
 * @returns {Array} returns.errors - Failed items with error details
 * 
 * @example
 * // Process user updates in batches
 * const { results, errors } = await batchWithConcurrency(
 *   users,
 *   async (user) => {
 *     return await updateUser(user.id, user.data);
 *   },
 *   10 // Process 10 users concurrently
 * );
 * 
 * @example
 * // Batch email sending
 * const { results, errors } = await batchWithConcurrency(
 *   emailList,
 *   async (email) => await sendEmail(email),
 *   5
 * );
 * 
 * if (errors.length > 0) {
 *   logger.warn(`${errors.length} emails failed to send`);
 * }
 * 
 * @performance
 * - Prevents overwhelming system resources with unlimited concurrency
 * - Processes items in optimal batch sizes
 * - Continues processing even if some items fail
 * 
 * @security
 * - Limits concurrent operations to prevent DoS
 * - Errors are isolated and don't stop batch processing
 * 
 * @note
 * All items are processed. Errors are collected but don't stop the batch.
 * Use this for non-critical operations where partial success is acceptable.
 */
export async function batchWithConcurrency(items, processor, concurrency = 5) {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          item: batch[index],
          error: result.reason,
        });
      }
    });
  }
  
  return { results, errors };
}

/**
 * Measure and log execution time of an async operation.
 * 
 * Wraps an async function to automatically measure and log its execution time.
 * Logs warnings for slow operations (>1000ms) and errors if operation fails.
 * 
 * @async
 * @function measureTime
 * @param {string} operation - Name/identifier for the operation (used in logs)
 * @param {Function} fn - Async function to measure
 * @returns {Promise<*>} The result of the function
 * @throws {Error} Re-throws any error from the function
 * 
 * @example
 * // Measure database query time
 * const users = await measureTime('fetchUsers', async () => {
 *   return await User.find().lean();
 * });
 * 
 * @example
 * // Measure API call time
 * const data = await measureTime('externalAPI', async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return response.json();
 * });
 * 
 * @performance
 * - Automatically logs slow operations for performance monitoring
 * - Helps identify performance bottlenecks
 * - Integrates with metrics collection system
 * 
 * @note
 * Duration is logged even if operation fails, helping identify slow failures.
 */
export async function measureTime(operation, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.performance(operation, duration, { error: error.message });
    throw error;
  }
}

/**
 * Safely parse JSON string with fallback value on error.
 * 
 * Prevents application crashes from malformed JSON. Returns fallback value
 * instead of throwing, making it safe for parsing user input or external data.
 * 
 * @function safeJsonParse
 * @param {string} str - JSON string to parse
 * @param {*} [fallback=null] - Value to return if parsing fails
 * @returns {*} Parsed JSON object or fallback value
 * 
 * @example
 * // Parse user input safely
 * const config = safeJsonParse(userInput, {});
 * 
 * @example
 * // Parse API response with default
 * const data = safeJsonParse(responseBody, { error: 'Invalid JSON' });
 * 
 * @example
 * // Parse cache value
 * const cached = safeJsonParse(redisValue, null);
 * if (cached) {
 *   return cached;
 * }
 * 
 * @security
 * - Prevents JSON parsing attacks from crashing the application
 * - Logs parsing errors for monitoring
 * - Truncates logged strings to prevent log injection
 * 
 * @note
 * Only logs first 100 characters of failed string to prevent log bloat.
 * Use this for parsing untrusted or external data sources.
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.warn('JSON parse error', { error: error.message, str: str?.substring(0, 100) });
    return fallback;
  }
}

/**
 * Sanitize data by removing or redacting sensitive fields before logging.
 * 
 * Recursively traverses objects and arrays to find and redact sensitive fields.
 * Prevents accidental exposure of passwords, tokens, secrets, and other sensitive data
 * in application logs. Essential for security compliance (HIPAA, GDPR, etc.).
 * 
 * @function sanitizeForLogging
 * @param {*} data - Data object, array, or primitive to sanitize
 * @param {string[]} [sensitiveFields=['password', 'token', 'secret', 'key', 'authorization']] - 
 *   Array of field names to redact
 * @returns {*} Sanitized data with sensitive fields replaced by '***REDACTED***'
 * 
 * @example
 * // Sanitize user object before logging
 * const sanitized = sanitizeForLogging(user, ['password', 'ssn', 'creditCard']);
 * logger.info('User created', sanitized);
 * 
 * @example
 * // Sanitize request body
 * const safeBody = sanitizeForLogging(req.body);
 * logger.debug('Request received', { body: safeBody });
 * 
 * @example
 * // Custom sensitive fields
 * const sanitized = sanitizeForLogging(patientData, [
 *   'password',
 *   'ssn',
 *   'medicalRecordNumber',
 *   'insuranceNumber'
 * ]);
 * 
 * @security
 * - **CRITICAL**: Always use before logging user input or database records
 * - Prevents sensitive data leakage in logs
 * - Required for HIPAA/GDPR compliance
 * - Works recursively on nested objects and arrays
 * 
 * @compliance
 * - HIPAA: Protects PHI (Protected Health Information)
 * - GDPR: Protects personal data
 * - PCI-DSS: Protects payment card data
 * 
 * @note
 * This function creates a shallow copy. Nested objects are sanitized recursively.
 * Original data is not modified. Use this for ALL logging operations involving user data.
 * 
 * @see {@link https://www.hhs.gov/hipaa|HIPAA Compliance}
 * @see {@link https://gdpr.eu|GDPR Compliance}
 */
export function sanitizeForLogging(data, sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, sensitiveFields));
  }
  
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key], sensitiveFields);
    }
  }
  
  return sanitized;
}
