/**
 * Enterprise cache limits – how big companies handle cache sizing and eviction.
 * Prevents unbounded growth in memory and storage; all caches are bounded with eviction.
 *
 * @see CursorMD/CACHE_STRATEGY.md
 * @see CursorMD/New/realtime-caching-strategy.md
 */

/** Max number of API response entries in the client in-memory cache (lib/utils/api-cache.js). */
export const MAX_API_CACHE_ENTRIES = 500;

/** Max number of dashboard cache entries in memory per scope (lib/cache/dashboard-cache.js). */
export const MAX_DASHBOARD_CACHE_ENTRIES_PER_SCOPE = 20;

/** Max total keys written to localStorage for dashboard (prefix dashboard_cache:). Evict oldest when over. */
export const MAX_DASHBOARD_STORAGE_KEYS = 100;

/** Recent search entries per scope (lib/utils/recent-search-cache.js) – already bounded at 10. */
export const MAX_RECENT_SEARCH_ENTRIES = 10;

/**
 * Optional global prefix for all Redis keys (env: CACHE_KEY_PREFIX).
 * Use in production to isolate keys per environment (e.g. clinic_prod, clinic_staging).
 */
export function getRedisKeyPrefix() {
  if (typeof process === 'undefined' || !process.env) return '';
  const p = process.env.CACHE_KEY_PREFIX;
  return typeof p === 'string' && p.trim() ? p.trim() + ':' : '';
}
