/**
 * Dashboard preloader – fires critical API requests in parallel before the dashboard
 * page renders, so server caches warm and SWR can dedupe or get faster responses.
 * Use from dashboard layout (client) with apiClient as the fetcher.
 * Preload list driven by ROUTE_PERFORMANCE_CONFIG['/dashboard'].preload when available.
 */

import { ROUTE_PERFORMANCE_CONFIG } from '@/lib/constants/routes.js';

/**
 * Build today's date string (YYYY-MM-DD) for appointment queries.
 */
function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Map preload key from ROUTE_PERFORMANCE_CONFIG to { key, fetcher } factory. */
function getPreloadQuery(key, tenantId, userId, today, fetchFn) {
  switch (key) {
    case 'stats':
      return { key: `stats:${tenantId}:${userId}`, fetcher: () => fetchFn('/reports/dashboard') };
    case 'appointments':
      return {
        key: `appointments-today:${tenantId}:${today}`,
        fetcher: () => fetchFn(`/appointments?date=${today}&limit=5`),
      };
    case 'queue':
      return {
        key: `queue:${tenantId}:${userId}`,
        fetcher: () => fetchFn('/queue?status=waiting&limit=100'),
      };
    default:
      return null;
  }
}

/**
 * Preload critical dashboard data in parallel. Does not block; use to start
 * requests early so dashboard SWR hooks get cache hits or deduped requests.
 *
 * @param {string} tenantId - Current tenant (for cache keys if using cacheManager)
 * @param {string} userId - Current user id (for cache keys if using cacheManager)
 * @param {string} role - User role (doctor vs clinic; can be used to skip or add queries)
 * @param {object} options
 * @param {(endpoint: string) => Promise<unknown>} options.fetchFn - e.g. apiClient.get
 * @param {{ getOrFetch: (key: string, fetcher: () => Promise<unknown>) => Promise<unknown> }} [options.cacheManager] - Optional; if provided, uses getOrFetch so results are cached
 */
export async function preloadCriticalData(tenantId, userId, role, options = {}) {
  const { fetchFn, cacheManager } = options;

  if (typeof fetchFn !== 'function') {
    return;
  }

  const today = getTodayDateString();
  const dashboardConfig = ROUTE_PERFORMANCE_CONFIG['/dashboard'];
  const preloadKeys = Array.isArray(dashboardConfig?.preload)
    ? dashboardConfig.preload
    : ['stats', 'appointments', 'queue'];

  const criticalQueries = preloadKeys
    .map((k) => getPreloadQuery(k, tenantId, userId, today, fetchFn))
    .filter(Boolean);

  const runOne = (q) => {
    const doFetch = () => q.fetcher();
    if (cacheManager && typeof cacheManager.getOrFetch === 'function') {
      return cacheManager.getOrFetch(q.key, doFetch);
    }
    return doFetch();
  };

  await Promise.allSettled(criticalQueries.map((q) => runOne(q)));
}

export const DashboardPreloader = { preloadCriticalData };
