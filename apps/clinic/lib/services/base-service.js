/**
 * Enterprise Base Service
 * 
 * Provides common patterns and utilities for all service layer functions.
 * Includes transaction management, error handling, caching, and performance tracking.
 * 
 * @module lib/services/base-service
 * @since 1.0.0
 */

import connectDB from '@/lib/db/connection.js';
import { logger } from '@/lib/utils/logger.js';
import { measureTime, retryWithBackoff, cacheWithFallback } from '@/lib/utils/enterprise-helpers.js';
import { executeQuery } from '@/lib/db/query-optimizer.js';
import { recordDatabaseQuery } from '@/lib/monitoring/metrics.js';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/custom-errors.js';

/**
 * Base service class with common enterprise patterns.
 * 
 * All services should extend or use patterns from this base class for consistency.
 * 
 * @class BaseService
 */
export class BaseService {
  /**
   * Service name for logging and metrics
   * @type {string}
   */
  serviceName = 'BaseService';

  /**
   * Execute a database operation with enterprise patterns.
   * 
   * Wraps database operations with:
   * - Connection management
   * - Performance tracking
   * - Error handling
   * - Query optimization
   * 
   * @async
   * @method executeDbOperation
   * @param {string} operation - Operation name (e.g., 'find', 'create', 'update')
   * @param {string} collection - Collection/model name
   * @param {Function} queryFn - Async function that performs the database operation
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.useRetry=true] - Whether to retry on transient errors
   * @param {boolean} [options.trackMetrics=true] - Whether to track performance metrics
   * @returns {Promise<*>} Result of the database operation
   * 
   * @example
   * const users = await this.executeDbOperation(
   *   'find',
   *   'users',
   *   () => User.find({ active: true }).lean()
   * );
   * 
   * @throws {Error} Re-throws database errors with context
   */
  async executeDbOperation(operation, collection, queryFn, options = {}) {
    const { useRetry = true, trackMetrics = true } = options;
    
    await connectDB();
    
    const executeQuery = async () => {
      const startTime = Date.now();
      try {
        const result = await queryFn();
        const duration = Date.now() - startTime;
        
        if (trackMetrics) {
          recordDatabaseQuery(collection, duration, true);
        }
        
        logger.database(operation, collection, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (trackMetrics) {
          recordDatabaseQuery(collection, duration, false);
        }
        
        logger.error(`Database ${operation} failed`, error, {
          collection,
          operation,
          duration,
        });
        
        throw error;
      }
    };
    
    if (useRetry) {
      return await retryWithBackoff(executeQuery, {
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
      });
    }
    
    return await executeQuery();
  }

  /**
   * Execute operation with caching support.
   * 
   * Attempts to retrieve from cache first, falls back to execution,
   * then caches the result for future requests.
   * 
   * @async
   * @method executeWithCache
   * @param {string} cacheKey - Unique cache key
   * @param {Function} operationFn - Async function to execute on cache miss
   * @param {number} [ttlSeconds=300] - Cache TTL in seconds
   * @param {Object} [options={}] - Additional options
   * @param {string} [options.cachePrefix] - Cache key prefix
   * @param {boolean} [options.useCache=true] - Whether to use cache
   * @returns {Promise<*>} Cached or freshly computed result
   * 
   * @example
   * const user = await this.executeWithCache(
   *   `user:${userId}`,
   *   () => User.findById(userId).lean(),
   *   600, // 10 minutes
   *   { cachePrefix: 'users' }
   * );
   */
  async executeWithCache(cacheKey, operationFn, ttlSeconds = 300, options = {}) {
    return await cacheWithFallback(
      cacheKey,
      operationFn,
      ttlSeconds,
      options
    );
  }

  /**
   * Validate entity exists and belongs to tenant.
   * 
   * Common pattern for validating entity ownership in multi-tenant systems.
   * 
   * @async
   * @method validateEntityExists
   * @param {Object} Model - Mongoose model
   * @param {string} entityId - Entity ID to validate
   * @param {string} tenantId - Tenant ID for ownership check
   * @param {Object} [additionalFilters={}] - Additional query filters
   * @param {string} [entityName='Entity'] - Entity name for error messages
   * @returns {Promise<Object>} Found entity
   * @throws {NotFoundError} If entity not found or doesn't belong to tenant
   * 
   * @example
   * const patient = await this.validateEntityExists(
   *   Patient,
   *   patientId,
   *   tenantId,
   *   { deletedAt: null },
   *   'Patient'
   * );
   */
  async validateEntityExists(Model, entityId, tenantId, additionalFilters = {}, entityName = 'Entity') {
    const { withTenant } = await import('@/lib/db/tenant-helper.js');
    
    const entity = await this.executeDbOperation(
      'findOne',
      Model.modelName.toLowerCase(),
      () => Model.findOne(
        withTenant(tenantId, {
          _id: entityId,
          ...additionalFilters,
        })
      ).lean(),
      { useRetry: false }
    );
    
    if (!entity) {
      throw new NotFoundError(`${entityName} not found or access denied`);
    }
    
    return entity;
  }

  /**
   * Validate entity doesn't already exist (for uniqueness checks).
   * 
   * @async
   * @method validateEntityNotExists
   * @param {Object} Model - Mongoose model
   * @param {Object} query - Query to check for existing entity
   * @param {string} [entityName='Entity'] - Entity name for error messages
   * @returns {Promise<void>}
   * @throws {ConflictError} If entity already exists
   * 
   * @example
   * await this.validateEntityNotExists(
   *   Patient,
   *   { tenantId, patientId: 'PAT-001' },
   *   'Patient'
   * );
   */
  async validateEntityNotExists(Model, query, entityName = 'Entity') {
    const existing = await this.executeDbOperation(
      'findOne',
      Model.modelName.toLowerCase(),
      () => Model.findOne(query).lean(),
      { useRetry: false }
    );
    
    if (existing) {
      throw new ConflictError(`${entityName} already exists`);
    }
  }

  /**
   * Execute operation within a transaction (if supported).
   * 
   * Note: MongoDB transactions require replica set. Falls back to
   * sequential execution if transactions not available.
   * 
   * @async
   * @method executeInTransaction
   * @param {Function} transactionFn - Async function containing transaction operations
   * @param {Object} [options={}] - Transaction options
   * @returns {Promise<*>} Result of transaction function
   * 
   * @example
   * await this.executeInTransaction(async (session) => {
   *   await User.create([user1, user2], { session });
   *   await Patient.create([patient1, patient2], { session });
   * });
   */
  async executeInTransaction(transactionFn, options = {}) {
    await connectDB();
    const mongoose = (await import('mongoose')).default;
    
    // Check if transactions are supported
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Database not connected, transactions not available');
      return await transactionFn(null);
    }
    
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      const result = await transactionFn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Transaction failed, rolled back', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Paginate query results with enterprise patterns.
   * 
   * @async
   * @method paginateQuery
   * @param {Object} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} [options={}] - Pagination options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {Object} [options.sort={ createdAt: -1 }] - Sort criteria
   * @param {string|Object} [options.select] - Fields to select
   * @param {Object|Array} [options.populate] - Population options
   * @returns {Promise<Object>} Paginated result with items and pagination metadata
   * 
   * @example
   * const result = await this.paginateQuery(
   *   Patient,
   *   { tenantId, status: 'active' },
   *   { page: 1, limit: 20, sort: { createdAt: -1 } }
   * );
   */
  async paginateQuery(Model, filter, options = {}) {
    const { paginatedQuery } = await import('@/lib/db/query-optimizer.js');
    return await paginatedQuery(Model, filter, options);
  }
}

/**
 * Create a service instance with enterprise patterns.
 * 
 * Factory function for creating service instances with consistent patterns.
 * 
 * @function createService
 * @param {string} serviceName - Name of the service for logging
 * @returns {BaseService} Service instance
 * 
 * @example
 * const patientService = createService('PatientService');
 * const users = await patientService.paginateQuery(User, { active: true });
 */
export function createService(serviceName) {
  const service = new BaseService();
  service.serviceName = serviceName;
  return service;
}
