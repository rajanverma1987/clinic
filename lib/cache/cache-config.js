/**
 * Cache strategy config for SWR and dashboard data.
 * Aligned with CursorMD/New realtime-caching-strategy.md (staleTime/cacheTime in ms).
 * Backend Redis TTLs: lib/constants/cache-ttl.js (seconds).
 */

/** Critical data: today's appointments – 30s stale, refetch on focus */
const APPOINTMENTS = {
  staleTime: 30000,
  cacheTime: 300000,
  refetchOnFocus: true,
  refetchOnReconnect: true,
};

/** Patients: 60s stale, 10min cache */
const PATIENTS = {
  staleTime: 60000,
  cacheTime: 600000,
  refetchOnFocus: false,
};

/** Analytics/stats: 5 min stale, 1hr cache */
const ANALYTICS = {
  staleTime: 300000,
  cacheTime: 3600000,
  refetchOnMount: false,
  refetchOnFocus: false,
};

/** Static: doctors – 1 hour, infinite cache */
const DOCTORS = {
  staleTime: 3600000,
  cacheTime: Number.POSITIVE_INFINITY,
  refetchOnFocus: false,
};

/** Dashboard stats – 5 min, refetch on focus */
const DASHBOARD_STATS = {
  staleTime: 300000,
  cacheTime: 600000,
  refetchOnFocus: true,
};

/** Dashboard lists (today appointments) – 30s, refetch on focus */
const DASHBOARD_LISTS = {
  staleTime: 30000,
  cacheTime: 300000,
  refetchOnFocus: true,
};

/** Dashboard charts – 5 min */
const DASHBOARD_CHARTS = {
  staleTime: 300000,
  cacheTime: 3600000,
  refetchOnMount: false,
};

export const CACHE_CONFIG = {
  appointments: APPOINTMENTS,
  patients: PATIENTS,
  analytics: ANALYTICS,
  doctors: DOCTORS,
  dashboardStats: DASHBOARD_STATS,
  dashboardLists: DASHBOARD_LISTS,
  dashboardCharts: DASHBOARD_CHARTS,
};

/**
 * Get SWR config options for a key (e.g. 'appointments', 'patients').
 * @param {string} key - One of CACHE_CONFIG keys
 * @returns {object} SWR options
 */
export function getSWROptions(key) {
  const config = CACHE_CONFIG[key];
  if (!config) return {};
  return {
    revalidateOnFocus: config.refetchOnFocus !== false,
    revalidateOnReconnect: config.refetchOnReconnect !== false,
    dedupingInterval: config.staleTime ?? 0,
    keepPreviousData: true,
    ...config,
  };
}
