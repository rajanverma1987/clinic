/**
 * API Cache Utility
 * In-memory cache for API responses with TTL by endpoint and prefix invalidation.
 * Bounded by MAX_API_CACHE_ENTRIES; evicts oldest entries when full (enterprise-style).
 * Used by apiClient for GET requests; server-side uses Redis via CacheManager when available.
 */

import { MAX_API_CACHE_ENTRIES } from '@/lib/constants/cache-limits';

const cache = new Map();

/** Default TTL (ms) when not overridden by endpoint rules */
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Evict oldest entries by timestamp until size is below limit.
 */
function evictIfOverLimit() {
  if (cache.size <= MAX_API_CACHE_ENTRIES) return;
  const entries = Array.from(cache.entries()).map(([k, v]) => ({ key: k, timestamp: v.timestamp }));
  entries.sort((a, b) => a.timestamp - b.timestamp);
  const toRemove = entries.slice(0, cache.size - MAX_API_CACHE_ENTRIES);
  toRemove.forEach(({ key }) => cache.delete(key));
}

/** Endpoint → TTL (ms). Shorter for frequently changing data, longer for reports. */
const TTL_BY_PREFIX = [
  { prefix: '/reports/', ttlMs: 2 * 60 * 1000 }, // 2 min – dashboard, revenue, charts
  { prefix: '/appointments', ttlMs: 1 * 60 * 1000 }, // 1 min – lists
  { prefix: '/patients', ttlMs: 1 * 60 * 1000 },
  { prefix: '/invoices', ttlMs: 1 * 60 * 1000 },
  { prefix: '/inventory', ttlMs: 1 * 60 * 1000 },
  { prefix: '/prescriptions', ttlMs: 1 * 60 * 1000 },
  { prefix: '/queue', ttlMs: 1 * 60 * 1000 },
  { prefix: '/doctors/', ttlMs: 2 * 60 * 1000 }, // 2 min – doctor dashboard
];

/**
 * Get TTL in ms for an endpoint (used when setting cache).
 * @param {string} endpoint - e.g. '/reports/dashboard' or '/appointments?date=...'
 * @returns {number} TTL in milliseconds
 */
export function getCacheTtlForEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') return DEFAULT_TTL_MS;
  const match = TTL_BY_PREFIX.find(({ prefix }) => endpoint.startsWith(prefix));
  return match ? match.ttlMs : DEFAULT_TTL_MS;
}

/**
 * Get cached response if available and not expired.
 * @param {string} key - Cache key (from generateCacheKey).
 * @returns {*} Cached data or null
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
 * Set response in cache with optional duration.
 * Evicts oldest entries when at MAX_API_CACHE_ENTRIES (enterprise bounded cache).
 * @param {string} key - Cache key
 * @param {*} data - Response data to cache
 * @param {number} [duration] - TTL in ms; if omitted, DEFAULT_TTL_MS is used
 */
export function setCachedResponse(key, data, duration = DEFAULT_TTL_MS) {
  evictIfOverLimit();
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration,
  });
}

/**
 * Clear a specific cache entry by key.
 */
export function clearCache(key) {
  cache.delete(key);
}

/**
 * Clear all cache entries whose key starts with the given prefix.
 * Use after mutations to invalidate related GET responses (e.g. prefix '/reports' clears all report caches).
 * @param {string} prefix - Key prefix (e.g. '/reports' or '/appointments')
 */
export function clearCacheByPrefix(prefix) {
  if (!prefix) return;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Clear all cache (e.g. on logout).
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Generate cache key from URL and optional params.
 * Params are sorted for stable keys when the same query is built differently.
 */
export function generateCacheKey(url, params = {}) {
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `${url}${url.includes('?') ? '&' : '?'}${sorted}`;
  }
  return url;
}

