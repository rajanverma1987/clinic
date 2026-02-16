/**
 * Dashboard data via SWR with CACHE_CONFIG.
 * Level 2: IndexedDB for offline-first (read from cache first, write on success).
 * Critical: today's appointments 30s stale, refetch on focus, 30s poll when tab active.
 */

import { apiClient } from '@/lib/api/client';
import { getSWROptions } from '@/lib/cache/cache-config';
import { getCurrentTenantId } from '@/lib/cache/current-tenant';
import { getIndexedDBCache, setIndexedDBCache } from '@/lib/cache/indexed-db-cache';
import { recordCacheHit, recordCacheMiss } from '@/lib/cache/perf-markers';
import {
  DASHBOARD_CHARTS_KEY,
  DASHBOARD_LISTS_KEY,
  DASHBOARD_STATS_KEY,
} from '@/lib/swr/dashboard-keys';
import useSWR from 'swr';

const FETCH_TIMEOUT_MS = 15000; // Prevent infinite skeleton if an API hangs

async function fetchStatsWithIndexedDB(tenantId) {
  const scope = 'stats';
  const id = tenantId || getCurrentTenantId();
  const doFetch = async () => {
    const res = await apiClient.get('/reports/dashboard');
    const data = res.success ? res.data : null;
    if (data && id) setIndexedDBCache(scope, id, data).catch(() => {});
    recordCacheMiss();
    return data;
  };
  const timeoutFallback = () =>
    id ? getIndexedDBCache(scope, id).then((c) => c?.data ?? null) : Promise.resolve(null);
  const withTimeout = Promise.race([
    doFetch().catch(async (e) => {
      const cached = await timeoutFallback();
      if (cached) {
        recordCacheHit();
        return cached;
      }
      throw e;
    }),
    new Promise((resolve) => setTimeout(() => timeoutFallback().then(resolve), FETCH_TIMEOUT_MS)),
  ]);
  return withTimeout;
}

function useDashboardStatsSWR(tenantId) {
  const opts = getSWROptions('dashboardStats');
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    tenantId ? DASHBOARD_STATS_KEY : null,
    () => fetchStatsWithIndexedDB(tenantId),
    {
      ...opts,
      revalidateOnFocus: false,
      dedupingInterval: opts.staleTime ?? 5 * 60 * 1000,
    }
  );
  const stats = data ?? null;
  const loading = isLoading;
  return {
    stats,
    loading,
    error,
    mutate,
    isValidating,
    fetchStats: mutate,
  };
}

const EMPTY_LISTS_PAYLOAD = {
  todayAppointments: [],
  recentPatients: [],
  overdueInvoices: [],
  lowStockList: [],
  prescriptionRefills: [],
  queueStatus: { active: 0, waiting: 0, inProgress: 0 },
  criticalAlerts: [],
  expiringLots: [],
  appointmentRequests: [],
};

async function fetchListsWithIndexedDB(tenantId, fetchLists) {
  const scope = 'lists';
  const id = tenantId || getCurrentTenantId();
  const timeoutFallback = () =>
    id ? getIndexedDBCache(scope, id).then((c) => c?.data ?? EMPTY_LISTS_PAYLOAD) : Promise.resolve(EMPTY_LISTS_PAYLOAD);
  const doFetch = async () => {
    const data = await fetchLists();
    if (data && id) setIndexedDBCache(scope, id, data).catch(() => {});
    recordCacheMiss();
    return data;
  };
  const withTimeout = Promise.race([
    doFetch().catch(async (e) => {
      const cached = await timeoutFallback();
      if (cached && cached !== EMPTY_LISTS_PAYLOAD) {
        recordCacheHit();
        return cached;
      }
      throw e;
    }),
    new Promise((resolve) => setTimeout(() => timeoutFallback().then(resolve), FETCH_TIMEOUT_MS)),
  ]);
  return withTimeout;
}

function useDashboardListsSWR(tenantId) {
  const opts = getSWROptions('dashboardLists');
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    tenantId ? DASHBOARD_LISTS_KEY : null,
    () =>
      fetchListsWithIndexedDB(tenantId, async () => {
        // Single combined endpoint — one HTTP round trip instead of 8
        const res = await apiClient.get('/dashboard/widgets');
        if (res?.success && res?.data) return res.data;
        return EMPTY_LISTS_PAYLOAD;
      }),
    {
      ...opts,
      revalidateOnFocus: false,
      dedupingInterval: opts.staleTime ?? 30 * 1000,
      refetchInterval: 0,
    }
  );
  const payload = data ?? null;
  return {
    todayAppointments: payload?.todayAppointments ?? [],
    recentPatients: payload?.recentPatients ?? [],
    overdueInvoices: payload?.overdueInvoices ?? [],
    lowStockList: payload?.lowStockList ?? [],
    prescriptionRefills: payload?.prescriptionRefills ?? [],
    queueStatus: payload?.queueStatus ?? { active: 0, waiting: 0, inProgress: 0 },
    criticalAlerts: payload?.criticalAlerts ?? [],
    expiringLots: payload?.expiringLots ?? [],
    appointmentRequests: payload?.appointmentRequests ?? [],
    loading: isLoading,
    error,
    mutate,
    isValidating,
    fetchDashboardLists: mutate,
    listsData: payload,
  };
}

async function fetchChartsWithIndexedDB(tenantId, fetchCharts) {
  const scope = 'charts';
  const id = tenantId || getCurrentTenantId();
  const emptyCharts = { revenue: [], appointments: [], patients: [] };
  const timeoutFallback = () =>
    id ? getIndexedDBCache(scope, id).then((c) => c?.data ?? emptyCharts) : Promise.resolve(emptyCharts);
  const doFetch = async () => {
    const data = await fetchCharts();
    if (data && id) setIndexedDBCache(scope, id, data).catch(() => {});
    recordCacheMiss();
    return data;
  };
  const withTimeout = Promise.race([
    doFetch().catch(async (e) => {
      const cached = await timeoutFallback();
      if (cached && cached !== emptyCharts) {
        recordCacheHit();
        return cached;
      }
      throw e;
    }),
    new Promise((resolve) => setTimeout(() => timeoutFallback().then(resolve), FETCH_TIMEOUT_MS)),
  ]);
  return withTimeout;
}

function useDashboardChartsSWR(tenantId, options = {}) {
  const { enabled = true } = options;
  const opts = getSWROptions('dashboardCharts');
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    tenantId && enabled ? DASHBOARD_CHARTS_KEY : null,
    () =>
      fetchChartsWithIndexedDB(tenantId, async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        const revenueParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const appointmentParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const patientParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
          includeNewPatients: 'true',
        });
        const [revenueRes, appointmentRes, patientRes] = await Promise.allSettled([
          apiClient.get(`/reports/revenue?${revenueParams}`),
          apiClient.get(`/reports/appointments?${appointmentParams}`),
          apiClient.get(`/reports/patients?${patientParams}`),
        ]);
        const revenue =
          revenueRes.status === 'fulfilled' && revenueRes.value?.success && revenueRes.value?.data
            ? revenueRes.value.data.timeSeries || []
            : [];
        const appointments =
          appointmentRes.status === 'fulfilled' &&
          appointmentRes.value?.success &&
          appointmentRes.value?.data
            ? appointmentRes.value.data.timeSeries || []
            : [];
        const patients =
          patientRes.status === 'fulfilled' && patientRes.value?.success && patientRes.value?.data
            ? patientRes.value.data.timeSeries || []
            : [];
        return { revenue, appointments, patients };
      }),
    {
      ...opts,
      revalidateOnFocus: false,
      dedupingInterval: opts.staleTime ?? 5 * 60 * 1000,
    }
  );
  const chartData = data ?? { revenue: [], appointments: [], patients: [] };
  return {
    chartData: {
      revenue: chartData.revenue ?? [],
      appointments: chartData.appointments ?? [],
      patients: chartData.patients ?? [],
    },
    loading: isLoading,
    error,
    mutate,
    isValidating,
    fetchChartData: mutate,
  };
}

export { useDashboardChartsSWR, useDashboardListsSWR, useDashboardStatsSWR };
