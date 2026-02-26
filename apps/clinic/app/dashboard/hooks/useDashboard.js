/**
 * useDashboard — unified dashboard hook with lightning-fast first paint.
 * Phase 1: /api/dashboard/summary (metrics-only, <200ms) → KPIs visible immediately.
 * Phase 2: /api/dashboard/all (stats + lists + charts) → full dashboard.
 * SWR dedupes and caches; layout/sidebar prefetch so data is often ready before click.
 */

import { apiClient } from '@/lib/api/client';
import { onRealtimeEvent } from '@/lib/realtime/realtime-client';
import { useMemo, useEffect } from 'react';
import useSWR from 'swr';

/** SWR key for dashboard/all — use in layout/sidebar prefetch. */
export const DASHBOARD_ALL_KEY = '/api/dashboard/all';

/** SWR key for fast KPI summary (metrics table only). */
export const DASHBOARD_SUMMARY_KEY = '/api/dashboard/summary';

const allFetcher = async () => {
  const res = await apiClient.get('/dashboard/all');
  if (!res?.success) throw new Error(res?.error?.message || 'Dashboard fetch failed');
  return res.data;
};

const summaryFetcher = async () => {
  const res = await apiClient.get('/dashboard/summary');
  if (!res?.success) throw new Error(res?.error?.message || 'Summary fetch failed');
  return res.data;
};

/** Map summary API shape to stats shape expected by page (KPIs, revenue, queue). */
function mapSummaryToStats(summary) {
  if (!summary || typeof summary !== 'object') return null;
  const appointments = summary.appointments || {};
  const revenue = summary.revenue || {};
  const patients = summary.patients || {};
  const queue = summary.queue || {};
  const todayRevenue = revenue.today?.paid ?? revenue.today?.total ?? 0;
  const monthRevenue = revenue.thisMonth?.total ?? revenue.thisMonth?.paid ?? 0;
  return {
    todayAppointments: appointments.todayTotal ?? 0,
    appointments: {
      todayTotal: appointments.todayTotal ?? 0,
      today: appointments.today ?? {},
      upcoming: appointments.upcoming ?? 0,
      thisMonth: appointments.thisMonth ?? 0,
      total: appointments.total ?? 0,
    },
    revenue: {
      today: { total: todayRevenue, paid: todayRevenue },
      thisMonth: { total: monthRevenue },
    },
    todayRevenue,
    monthRevenue,
    activePatients: patients.total ?? patients.active ?? 0,
    totalPatients: patients.total ?? patients.active ?? 0,
    patients: { total: patients.total ?? 0, active: patients.active ?? 0 },
    queue: typeof queue === 'object' && !Array.isArray(queue)
      ? queue
      : { waiting: 0, inProgress: 0 },
    lastUpdated: summary.lastUpdated,
    failed_transactions: summary.failed_transactions ?? 0,
  };
}

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

const swrOpts = {
  keepPreviousData: true,
  refreshInterval: (latestData) =>
    typeof document !== 'undefined' && document.hidden ? 0 : 90000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 15000,
  shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
};

export function useDashboard({ enabled = true } = {}) {
  const { data: summaryData, mutate: mutateSummary } = useSWR(
    enabled ? DASHBOARD_SUMMARY_KEY : null,
    summaryFetcher,
    { ...swrOpts, dedupingInterval: 10000 },
  );
  const { data: allData, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? DASHBOARD_ALL_KEY : null,
    allFetcher,
    swrOpts,
  );

  useEffect(() => {
    if (!enabled) return;
    const revalidate = () => {
      mutate();
      mutateSummary();
    };
    const unsubs = REVALIDATE_EVENTS.map((event) => onRealtimeEvent(event, revalidate));
    return () => unsubs.forEach((fn) => fn());
  }, [enabled, mutate, mutateSummary]);

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

  const fastStats = useMemo(() => mapSummaryToStats(summaryData), [summaryData]);
  const stats = allData?.stats ?? fastStats ?? null;
  const hasAnyData = !!summaryData || !!allData;
  const statsLoading = !hasAnyData && isLoading;
  const listsLoading = !allData;

  return {
    stats,
    statsLoading,
    todayAppointments: allData?.lists?.todayAppointments ?? [],
    recentPatients: allData?.lists?.recentPatients ?? [],
    overdueInvoices: allData?.lists?.overdueInvoices ?? [],
    lowStockList: allData?.lists?.lowStockItems ?? [],
    queueStatus: allData?.lists?.queueStatus ?? emptyQueueStatus,
    expiringLots: allData?.lists?.expiringLots ?? [],
    appointmentRequests: allData?.lists?.appointmentRequests ?? [],
    prescriptionRefills: allData?.lists?.prescriptionRefills ?? [],
    criticalAlerts: allData?.lists?.criticalAlerts ?? [],
    latestActivePrescription: allData?.lists?.latestActivePrescription ?? null,
    pendingLabResults: allData?.lists?.pendingLabResults ?? [],
    pendingLabResultsCount: allData?.lists?.pendingLabResultsCount ?? 0,
    chartData: allData?.charts ?? emptyCharts,
    trends: allData?.trends ?? { revenue: null, patientFlow: null },
    chartsLoading: !allData && isLoading,
    loading: !hasAnyData && isLoading,
    isRefreshing: isValidating && !isLoading,
    error,
    refresh: () => Promise.all([mutate(), mutateSummary()]),
    fetchDashboardLists: () => mutate(),
    removeFromQueue,
    hasFastStats: !!fastStats,
    hasFullData: !!allData,
  };
}
