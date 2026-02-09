/**
 * Route-level performance config: preload, cache strategy, virtual scroll, etc.
 * Consumed by layout/preload and route-specific hooks for tuning.
 */

export const ROUTE_PERFORMANCE_CONFIG = {
  '/dashboard': {
    preload: ['stats', 'appointments', 'queue'],
    priority: 'high',
    ssr: false,
    cacheStrategy: 'stale-while-revalidate',
    prefetchAdjacent: ['/patients', '/appointments'],
    bundleSize: 'split',
  },
  '/patients/[id]': {
    preload: ['overview', 'visits'],
    lazyLoad: ['prescriptions', 'invoices', 'lab-tests'],
    keepMounted: true,
    virtualScroll: true,
    cacheStrategy: 'cache-first',
  },
  '/appointments': {
    preload: [],
    virtualScroll: true,
    cacheStrategy: 'network-first',
    polling: { interval: 30000, enabled: true },
  },
  '/queue': {
    preload: [],
    realtime: true,
    cacheStrategy: 'network-only',
    optimisticUpdates: true,
  },
};
