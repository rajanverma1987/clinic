/**
 * useDashboard — single unified dashboard hook
 * One HTTP request to /api/dashboard/all replaces multiple stats + lists + charts requests.
 * SWR handles caching, deduplication, background revalidation.
 * Realtime events trigger targeted revalidation.
 */

import { apiClient } from '@/lib/api/client';
import { onRealtimeEvent } from '@/lib/realtime/realtime-client';
import { useEffect } from 'react';
import useSWR from 'swr';

/** SWR key for dashboard/all — use same key in layout preload. */
export const DASHBOARD_ALL_KEY = '/api/dashboard/all';

const fetcher = async () => {
  const res = await apiClient.get('/dashboard/all');
  if (!res?.success) throw new Error(res?.error?.message || 'Dashboard fetch failed');
  return res.data;
};

const REVALIDATE_EVENTS = [
  'appointment:created',
  'appointment:updated',
  'appointment:cancelled',
  'payment:received',
  'payment:failed',
  'queue:updated',
  'patient:created',
  'dashboard-events',
];

const emptyQueueStatus = { active: 0, waiting: 0, inProgress: 0 };
const emptyCharts = { revenue: [], appointments: [], patients: [] };

export function useDashboard({ enabled = true } = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? DASHBOARD_ALL_KEY : null,
    fetcher,
    {
      keepPreviousData: true,
      refreshInterval: (latestData) =>
        typeof document !== 'undefined' && document.hidden ? 0 : 90000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 15000,
      shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
    },
  );

  useEffect(() => {
    if (!enabled) return;
    const unsubs = REVALIDATE_EVENTS.map((event) => onRealtimeEvent(event, () => mutate()));
    return () => unsubs.forEach((fn) => fn());
  }, [enabled, mutate]);

  const removeFromQueue = (id) => {
    mutate(
      (current) => {
        if (!current?.lists?.queueStatus) return current;
        return {
          ...current,
          lists: {
            ...current.lists,
            queueStatus: {
              ...current.lists.queueStatus,
              waiting: Math.max(0, (current.lists.queueStatus.waiting ?? 0) - 1),
              active: Math.max(0, (current.lists.queueStatus.active ?? 0) - 1),
            },
          },
        };
      },
      { revalidate: false },
    );
  };

  return {
    stats: data?.stats ?? null,
    statsLoading: isLoading,
    todayAppointments: data?.lists?.todayAppointments ?? [],
    recentPatients: data?.lists?.recentPatients ?? [],
    overdueInvoices: data?.lists?.overdueInvoices ?? [],
    lowStockList: data?.lists?.lowStockItems ?? [],
    queueStatus: data?.lists?.queueStatus ?? emptyQueueStatus,
    expiringLots: data?.lists?.expiringLots ?? [],
    appointmentRequests: data?.lists?.appointmentRequests ?? [],
    prescriptionRefills: data?.lists?.prescriptionRefills ?? [],
    criticalAlerts: data?.lists?.criticalAlerts ?? [],
    chartData: data?.charts ?? emptyCharts,
    trends: data?.trends ?? { revenue: null, patientFlow: null },
    chartsLoading: isLoading,
    loading: isLoading,
    isRefreshing: isValidating && !isLoading,
    error,
    refresh: () => mutate(),
    fetchDashboardLists: () => mutate(),
    removeFromQueue,
  };
}
