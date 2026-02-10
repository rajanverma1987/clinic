/**
 * Enterprise Cache Manager
 * High-level caching operations with automatic key generation, TTL management, and invalidation strategies
 * Based on NEW-PLANS.md requirements
 */

import { recordCacheOperation } from '../monitoring/metrics.js';
import { logger } from '../utils/logger.js';
import { deleteCache, deleteCachePattern, getCache, setCache } from './redis-client.js';

/**
 * Generate cache key
 */
function generateKey(prefix, ...parts) {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Cache manager class
 */
export class CacheManager {
  /**
   * Get cached data with metrics
   */
  static async get(prefix, ...keyParts) {
    const key = generateKey(prefix, ...keyParts);
    try {
      const data = await getCache(key);
      if (data) {
        recordCacheOperation('hit', true);
        logger.debug(`Cache hit: ${key}`);
        return data;
      } else {
        recordCacheOperation('miss', true);
        logger.debug(`Cache miss: ${key}`);
        return null;
      }
    } catch (error) {
      recordCacheOperation('miss', false);
      logger.warn(`Cache read error: ${key}`, { error: error.message });
      return null;
    }
  }

  /**
   * Set cached data with error handling
   */
  static async set(prefix, data, ttlSeconds, ...keyParts) {
    const key = generateKey(prefix, ...keyParts);
    try {
      await setCache(key, data, ttlSeconds);
      logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.warn(`Cache write error: ${key}`, { error: error.message });
      return false;
    }
  }

  /**
   * Invalidate cache
   */
  static async invalidate(prefix, ...keyParts) {
    const key = generateKey(prefix, ...keyParts);
    return await deleteCache(key);
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern) {
    return await deleteCachePattern(pattern);
  }

  /**
   * Cache API response
   */
  static async cacheApiResponse(endpoint, params, data, ttlSeconds = 300) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await setCache(key, data, ttlSeconds);
  }

  /**
   * Get cached API response
   */
  static async getCachedApiResponse(endpoint, params) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await getCache(key);
  }

  /**
   * Cache user session
   */
  static async cacheSession(sessionId, sessionData, ttlSeconds = 7 * 24 * 60 * 60) {
    return await setCache(`session:${sessionId}`, sessionData, ttlSeconds);
  }

  /**
   * Get cached session
   */
  static async getCachedSession(sessionId) {
    return await getCache(`session:${sessionId}`);
  }

  /**
   * Cache clinic settings
   */
  static async cacheClinicSettings(tenantId, settings, ttlSeconds = 3600) {
    return await setCache(`clinic:settings:${tenantId}`, settings, ttlSeconds);
  }

  /**
   * Get cached clinic settings
   */
  static async getCachedClinicSettings(tenantId) {
    return await getCache(`clinic:settings:${tenantId}`);
  }
}

export default CacheManager;
