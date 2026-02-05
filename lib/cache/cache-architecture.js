/**
 * Multi-layer cache architecture for dashboard and app-wide caching.
 * Defines storage layers and cache strategies used by dashboard-cache-config and CacheManager.
 */

export const CACHE_LAYERS = {
  // Layer 1: Browser Memory (Fastest)
  MEMORY: {
    storage: 'in-memory',
    ttl: 60, // 1 minute
    maxSize: '50MB',
    priority: 1,
    use: 'Current session hot data',
  },

  // Layer 2: IndexedDB (Fast, Persistent)
  INDEXED_DB: {
    storage: 'indexeddb',
    ttl: 3600, // 1 hour
    maxSize: '500MB',
    priority: 2,
    use: 'Offline support, large datasets',
  },

  // Layer 3: localStorage (Moderate, Persistent)
  LOCAL_STORAGE: {
    storage: 'localStorage',
    ttl: 86400, // 24 hours
    maxSize: '10MB',
    priority: 3,
    use: 'User preferences, tokens',
  },

  // Layer 4: Service Worker Cache (Fast, Persistent)
  SERVICE_WORKER: {
    storage: 'cache-api',
    ttl: 604800, // 7 days
    maxSize: '100MB',
    priority: 4,
    use: 'Static assets, API responses',
  },

  // Layer 5: CDN Edge Cache (External)
  CDN: {
    storage: 'cdn-edge',
    ttl: 2592000, // 30 days
    priority: 5,
    use: 'Static assets, public data',
  },

  // Layer 6: Redis (Server-side)
  REDIS: {
    storage: 'redis',
    ttl: 300, // 5 minutes
    priority: 6,
    use: 'Shared session data, rate limiting',
  },
};

export const CACHE_STRATEGY = {
  // Cache-First: Serve from cache, update in background
  CACHE_FIRST: 'cache-first',

  // Network-First: Try network, fallback to cache
  NETWORK_FIRST: 'network-first',

  // Stale-While-Revalidate: Serve stale, fetch fresh in background
  SWR: 'stale-while-revalidate',

  // Network-Only: Always fetch fresh (no cache)
  NETWORK_ONLY: 'network-only',

  // Cache-Only: Only serve from cache
  CACHE_ONLY: 'cache-only',
};
