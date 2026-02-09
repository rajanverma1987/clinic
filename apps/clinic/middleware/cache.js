/**
 * Caching Middleware
 * Automatically caches API responses
 * Based on NEW-PLANS.md requirements
 */

import { CacheManager } from '@/lib/cache/cache-manager.js';
import { getCache } from '@/lib/cache/redis-client.js';

/**
 * Create cache key from request
 */
function createCacheKey(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const query = url.searchParams.toString();
  return `api:${path}:${query}`;
}

/**
 * Cache middleware for API routes
 */
export function withCache(handler, options = {}) {
  const { ttl = 300, enabled = true } = options;

  return async (req, ...args) => {
    // Only cache GET requests
    if (req.method !== 'GET' || !enabled) {
      return handler(req, ...args);
    }

    try {
      const cacheKey = createCacheKey(req);
      const cached = await getCache(cacheKey);

      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
          },
        });
      }

      // Execute handler
      const response = await handler(req, ...args);

      // Cache successful responses
      if (response.status === 200) {
        const data = await response.json();
        await CacheManager.setCache('api', data, ttl, req.url);
      }

      return response;
    } catch (error) {
      // If caching fails, just execute handler
      return handler(req, ...args);
    }
  };
}

export default withCache;
