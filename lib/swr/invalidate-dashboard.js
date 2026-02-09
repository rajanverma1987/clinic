/**
 * Dashboard SWR cache invalidation.
 * Use after mutations (appointment, patient, prescription) so dashboard and lists show fresh data.
 * Must be used inside SWRConfig (e.g. via useInvalidateDashboard hook).
 */

import {
  DASHBOARD_CHARTS_KEY,
  DASHBOARD_LISTS_KEY,
  DASHBOARD_STATS_KEY,
} from '@/lib/swr/dashboard-keys';

/**
 * Revalidate dashboard lists (today's appointments, recent patients, prescriptions, etc.).
 * @param {Function} mutate - from useSWRConfig().mutate
 */
export function invalidateDashboardLists(mutate) {
  if (typeof mutate === 'function') {
    mutate(DASHBOARD_LISTS_KEY);
  }
}

/**
 * Revalidate dashboard stats.
 * @param {Function} mutate - from useSWRConfig().mutate
 */
export function invalidateDashboardStats(mutate) {
  if (typeof mutate === 'function') {
    mutate(DASHBOARD_STATS_KEY);
  }
}

/**
 * Revalidate dashboard charts.
 * @param {Function} mutate - from useSWRConfig().mutate
 */
export function invalidateDashboardCharts(mutate) {
  if (typeof mutate === 'function') {
    mutate(DASHBOARD_CHARTS_KEY);
  }
}

/**
 * Revalidate all dashboard SWR keys (lists + stats). Use after appointment/patient/prescription mutations.
 * @param {Function} mutate - from useSWRConfig().mutate
 */
export function invalidateDashboard(mutate) {
  if (typeof mutate !== 'function') return;
  invalidateDashboardLists(mutate);
  invalidateDashboardStats(mutate);
}
