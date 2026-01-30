/**
 * Enterprise Service Decorator
 * 
 * Provides decorators and utilities to enhance existing services with
 * enterprise patterns without requiring refactoring.
 * 
 * @module lib/services/service-decorator
 * @since 1.0.0
 */

import { logger } from '@/lib/utils/logger.js';
import { measureTime, retryWithBackoff, cacheWithFallback } from '@/lib/utils/enterprise-helpers.js';
import { recordDatabaseQuery } from '@/lib/monitoring/metrics.js';
import CacheManager from '@/lib/cache/cache-manager.js';

/**
 * Decorate a service function with enterprise patterns.
 * 
 * Adds automatic:
 * - Performance tracking
 * - Error handling
 * - Caching (optional)
 * - Retry logic (optional)
 * - Logging
 * 
 * @function decorateService
 * @param {Function} serviceFn - Service function to decorate
 * @param {Object} [options={}] - Decoration options
 * @param {string} [options.operationName] - Operation name for logging
 * @param {boolean} [options.enableCache=false] - Enable caching
 * @param {number} [options.cacheTTL=300] - Cache TTL in seconds
 * @param {Function} [options.cacheKeyGenerator] - Function to generate cache key
 * @param {boolean} [options.enableRetry=false] - Enable retry on failure
 * @param {boolean} [options.trackMetrics=true] - Track performance metrics
 * @returns {Function} Decorated service function
 * 
 * @example
 * // Decorate existing service function
 * export const getPatientById = decorateService(
 *   async (patientId, tenantId, userId) => {
 *     return await Patient.findById(patientId).lean();
 *   },
 *   {
 *     operationName: 'getPatientById',
 *     enableCache: true,
 *     cacheTTL: 600,
 *     cacheKeyGenerator: (patientId, tenantId) => `patient:${tenantId}:${patientId}`
 *   }
 * );
 * 
 * @example
 * // With retry
 * export const fetchExternalData = decorateService(
 *   async (params) => {
 *     return await externalAPI.fetch(params);
 *   },
 *   {
 *     operationName: 'fetchExternalData',
 *     enableRetry: true,
 *     enableCache: true,
 *     cacheTTL: 300
 *   }
 * );
 */
export function decorateService(serviceFn, options = {}) {
  const {
    operationName = 'serviceOperation',
    enableCache = false,
    cacheTTL = 300,
    cacheKeyGenerator = null,
    enableRetry = false,
    trackMetrics = true,
  } = options;

  return async (...args) => {
    // Generate cache key if caching enabled
    let cacheKey = null;
    if (enableCache && cacheKeyGenerator) {
      cacheKey = cacheKeyGenerator(...args);
    }

    // Wrapper function for caching
    const executeOperation = async () => {
      return await measureTime(operationName, async () => {
        try {
          const result = await serviceFn(...args);
          
          if (trackMetrics) {
            logger.performance(operationName, Date.now(), {
              args: args.length,
            });
          }
          
          return result;
        } catch (error) {
          logger.error(`${operationName} failed`, error, {
            args: args.length,
          });
          throw error;
        }
      });
    };

    // Apply caching if enabled
    if (enableCache && cacheKey) {
      return await cacheWithFallback(
        cacheKey,
        executeOperation,
        cacheTTL,
        { cachePrefix: 'service' }
      );
    }

    // Apply retry if enabled
    if (enableRetry) {
      return await retryWithBackoff(executeOperation);
    }

    // Execute without caching/retry
    return await executeOperation();
  };
}

/**
 * Create a cached service function.
 * 
 * Convenience wrapper for creating cached service functions.
 * 
 * @function createCachedService
 * @param {Function} serviceFn - Service function
 * @param {Function} keyGenerator - Cache key generator function
 * @param {number} [ttlSeconds=300] - Cache TTL
 * @param {string} [operationName] - Operation name
 * @returns {Function} Cached service function
 * 
 * @example
 * export const getPatientById = createCachedService(
 *   async (patientId, tenantId) => {
 *     return await Patient.findById(patientId).lean();
 *   },
 *   (patientId, tenantId) => `patient:${tenantId}:${patientId}`,
 *   600, // 10 minutes
 *   'getPatientById'
 * );
 */
export function createCachedService(serviceFn, keyGenerator, ttlSeconds = 300, operationName = null) {
  return decorateService(serviceFn, {
    operationName: operationName || serviceFn.name,
    enableCache: true,
    cacheTTL: ttlSeconds,
    cacheKeyGenerator: keyGenerator,
  });
}

/**
 * Create a retryable service function.
 * 
 * Convenience wrapper for creating service functions with retry logic.
 * 
 * @function createRetryableService
 * @param {Function} serviceFn - Service function
 * @param {Object} [retryConfig={}] - Retry configuration
 * @param {string} [operationName] - Operation name
 * @returns {Function} Retryable service function
 * 
 * @example
 * export const fetchExternalAPI = createRetryableService(
 *   async (url) => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error('API Error');
 *     return response.json();
 *   },
 *   { maxAttempts: 3, initialDelay: 200 },
 *   'fetchExternalAPI'
 * );
 */
export function createRetryableService(serviceFn, retryConfig = {}, operationName = null) {
  return decorateService(serviceFn, {
    operationName: operationName || serviceFn.name,
    enableRetry: true,
    ...retryConfig,
  });
}

/**
 * Batch service operations with concurrency control.
 * 
 * Executes multiple service calls in parallel batches.
 * 
 * @function batchServiceOperations
 * @param {Array} items - Items to process
 * @param {Function} serviceFn - Service function to apply to each item
 * @param {number} [concurrency=5] - Maximum concurrent operations
 * @param {string} [operationName='batchOperation'] - Operation name for logging
 * @returns {Promise<Object>} Results and errors
 * 
 * @example
 * const { results, errors } = await batchServiceOperations(
 *   patientIds,
 *   async (patientId) => await getPatientById(patientId, tenantId),
 *   10, // Process 10 at a time
 *   'batchGetPatients'
 * );
 */
export async function batchServiceOperations(items, serviceFn, concurrency = 5, operationName = 'batchOperation') {
  const { batchWithConcurrency } = await import('@/lib/utils/enterprise-helpers.js');
  
  return await measureTime(operationName, async () => {
    return await batchWithConcurrency(
      items,
      async (item) => {
        try {
          return await serviceFn(item);
        } catch (error) {
          logger.error(`${operationName} - Item failed`, error, { item });
          throw error;
        }
      },
      concurrency
    );
  });
}
