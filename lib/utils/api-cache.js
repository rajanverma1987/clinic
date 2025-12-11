/**
 * API Cache Utility
 * Simple in-memory cache for API responses to reduce redundant requests
 */

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.duration) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Set response in cache
 */
export function setCachedResponse(key, data, duration = CACHE_DURATION) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration,
  });
}

/**
 * Clear specific cache entry
 */
export function clearCache(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Generate cache key from URL and params
 */
export function generateCacheKey(url, params = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${url}${sortedParams ? `?${sortedParams}` : ''}`;
}

