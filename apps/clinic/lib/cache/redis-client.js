/**
 * Redis Client (optional)
 * Handles Redis connection and caching. Fails gracefully when Redis is unavailable.
 * Set DISABLE_REDIS=true or REDIS_URL="" to run without Redis.
 * Set CACHE_KEY_PREFIX (e.g. clinic_prod) in production to isolate keys per environment.
 * Enterprise: run Redis with maxmemory and eviction policy (e.g. allkeys-lru) so cache is bounded.
 */

import { createClient } from 'redis';
import { getRedisKeyPrefix } from '@/lib/constants/cache-limits';
import { logger } from '@/lib/utils/logger.js';

function prefixKey(key) {
  const p = getRedisKeyPrefix();
  return p ? p + key : key;
}

function prefixPattern(pattern) {
  const p = getRedisKeyPrefix();
  return p ? p + pattern : pattern;
}

let client = null;
let isConnected = false;
/** When true, Redis was disabled or connection failed; skip further attempts and avoid WARN spam. */
let redisUnavailable = false;

/** Global flag so "connection refused" is warned only once per process (shared across module instances). */
const WARN_KEY = '__redis_connection_refused_warned';

function wasConnectionRefusedWarned() {
  if (typeof globalThis !== 'undefined' && globalThis[WARN_KEY]) return true;
  return false;
}

function setConnectionRefusedWarned() {
  if (typeof globalThis !== 'undefined') globalThis[WARN_KEY] = true;
}

function isRedisDisabledByEnv() {
  if (process.env.DISABLE_REDIS === 'true' || process.env.DISABLE_REDIS === '1') return true;
  const url = process.env.REDIS_URL;
  if (url === '' || url === 'false') return true;
  if (process.env.NODE_ENV !== 'production' && (url == null || url === undefined)) return true;
  return false;
}

/**
 * Get or create Redis client. Returns null if Redis is disabled or connection failed.
 */
export async function getRedisClient() {
  if (redisUnavailable) return null;
  if (client && isConnected) return client;

  if (isRedisDisabledByEnv()) {
    redisUnavailable = true;
    logger.debug('Redis disabled via DISABLE_REDIS or empty REDIS_URL');
    return null;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    client = createClient({ url: redisUrl });
  } catch (err) {
    redisUnavailable = true;
    logger.warn('Redis client creation failed (Redis optional)', { message: err?.message });
    return null;
  }

  client.on('error', (err) => {
    isConnected = false;
    if (redisUnavailable) return;
    if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
      if (!wasConnectionRefusedWarned()) {
        setConnectionRefusedWarned();
        logger.warn('Redis not available (connection refused). Cache will be skipped.', {
          hint: 'Start Redis or set DISABLE_REDIS=true to silence.',
        });
      }
      redisUnavailable = true;
    } else {
      logger.error('Redis Client Error', err);
    }
  });

  client.on('connect', () => {
    logger.info('Redis connected');
    isConnected = true;
  });

  client.on('disconnect', () => {
    isConnected = false;
  });

  try {
    await client.connect();
    isConnected = true;
    return client;
  } catch (err) {
    redisUnavailable = true;
    client = null;
    if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
      if (!wasConnectionRefusedWarned()) {
        setConnectionRefusedWarned();
        logger.warn('Redis not available (connection refused). Cache will be skipped.', {
          hint: 'Start Redis or set DISABLE_REDIS=true to silence.',
        });
      }
    } else {
      logger.warn('Redis connection failed (Redis optional)', { message: err?.message });
    }
    return null;
  }
}

/**
 * Get value from cache. Returns null if Redis is disabled or key missing.
 * Key is prefixed with CACHE_KEY_PREFIX when set (production isolation).
 */
export async function getCache(key) {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const k = prefixKey(key);
    const value = await redis.get(k);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.debug('Cache get failed', { key, message: error?.message });
    return null;
  }
}

/**
 * Set value in cache with TTL. Returns false if Redis is disabled or write failed.
 */
export async function setCache(key, value, ttlSeconds = 300) {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;
    const k = prefixKey(key);
    await redis.setEx(k, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.debug('Cache set failed', { key, message: error?.message });
    return false;
  }
}

/**
 * Delete cache key. Returns false if Redis is disabled.
 */
export async function deleteCache(key) {
  try {
    const redis = await getRedisClient();
    if (!redis) return false;
    const k = prefixKey(key);
    await redis.del(k);
    return true;
  } catch (error) {
    logger.debug('Cache delete failed', { key, message: error?.message });
    return false;
  }
}

/**
 * Delete cache keys by pattern. Returns 0 if Redis is disabled.
 * Pattern is prefixed with CACHE_KEY_PREFIX when set.
 */
export async function deleteCachePattern(pattern) {
  try {
    const redis = await getRedisClient();
    if (!redis) return 0;
    const p = prefixPattern(pattern);
    const keys = await redis.keys(p);
    if (keys.length > 0) await redis.del(keys);
    return keys.length;
  } catch (error) {
    logger.debug('Cache deletePattern failed', { pattern, message: error?.message });
    return 0;
  }
}

/**
 * Check if Redis is available (for health endpoint).
 */
export async function checkRedisHealth() {
  if (isRedisDisabledByEnv() || redisUnavailable) {
    return { available: false, reason: 'disabled or unavailable' };
  }
  try {
    const redis = await getRedisClient();
    if (!redis) return { available: false, reason: 'not connected' };
    await redis.ping();
    return { available: true };
  } catch (error) {
    return { available: false, error: error?.message };
  }
}

export default getRedisClient;
