/**
 * Redis Client
 * Handles Redis connection and caching operations
 * Based on NEW-PLANS.md requirements
 */

import { createClient } from 'redis';
import { logger } from '@/lib/utils/logger.js';

let client = null;
let isConnected = false;

/**
 * Get or create Redis client
 */
export async function getRedisClient() {
  if (client && isConnected) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  client = createClient({
    url: redisUrl,
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error', err);
    isConnected = false;
  });

  client.on('connect', () => {
    logger.info('Redis Client Connected');
    isConnected = true;
  });

  client.on('disconnect', () => {
    logger.warn('Redis Client Disconnected');
    isConnected = false;
  });

  if (!isConnected) {
    await client.connect();
  }

  return client;
}

/**
 * Get value from cache
 */
export async function getCache(key) {
  try {
    const redis = await getRedisClient();
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error getting cache key', error, { key });
    return null; // Fail gracefully
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCache(key, value, ttlSeconds = 300) {
  try {
    const redis = await getRedisClient();
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Error setting cache key', error, { key });
    return false; // Fail gracefully
  }
}

/**
 * Delete cache key
 */
export async function deleteCache(key) {
  try {
    const redis = await getRedisClient();
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Error deleting cache key', error, { key });
    return false;
  }
}

/**
 * Delete cache keys by pattern
 */
export async function deleteCachePattern(pattern) {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    return keys.length;
  } catch (error) {
    logger.error('Error deleting cache pattern', error, { pattern });
    return 0;
  }
}

/**
 * Check if Redis is available
 */
export async function checkRedisHealth() {
  try {
    const redis = await getRedisClient();
    await redis.ping();
    return { available: true };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

export default getRedisClient;
