'use client';

/**
 * Hook to invalidate dashboard SWR cache after mutations.
 * Call invalidateLists() or invalidate() after successful appointment/patient/prescription updates
 * so dashboard and tabs show fresh data. Must be used inside SWRConfig.
 */
import {
  invalidateDashboard as doInvalidateDashboard,
  invalidateDashboardCharts,
  invalidateDashboardLists,
  invalidateDashboardStats,
} from '@/lib/swr/invalidate-dashboard';
import { useSWRConfig } from 'swr';

export function useInvalidateDashboard() {
  const { mutate } = useSWRConfig();
  return {
    invalidateLists: () => invalidateDashboardLists(mutate),
    invalidateStats: () => invalidateDashboardStats(mutate),
    invalidateCharts: () => invalidateDashboardCharts(mutate),
    invalidate: () => doInvalidateDashboard(mutate),
  };
}
