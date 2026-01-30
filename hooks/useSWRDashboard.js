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
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const CRITICAL_POLL_MS = 30000;
const FETCH_TIMEOUT_MS = 15000; // Prevent infinite skeleton if an API hangs

function useTabVisible() {
  // Same initial value on server and client to avoid hydration mismatch (document is undefined on server)
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(!document.hidden);
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return visible;
}

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
      revalidateOnFocus: opts.refetchOnFocus !== false,
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
  const tabVisible = useTabVisible();
  const { data, error, mutate, isLoading, isValidating } = useSWR(
    tenantId ? DASHBOARD_LISTS_KEY : null,
    () =>
      fetchListsWithIndexedDB(tenantId, async () => {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const [
          appointmentsRes,
          patientsRes,
          invoicesRes,
          inventoryRes,
          prescriptionsRes,
          queueRes,
          lotsRes,
          requestsRes,
        ] = await Promise.allSettled([
          apiClient.get(`/appointments?date=${today}&limit=5`),
          apiClient.get('/patients?limit=5&sortBy=createdAt&sortOrder=desc'),
          apiClient.get('/invoices?status=pending&overdue=true&limit=5'),
          apiClient.get('/inventory/items?lowStock=true&limit=5'),
          apiClient.get('/prescriptions?status=active&limit=5'),
          apiClient.get('/queue?status=waiting&limit=100'),
          apiClient.get('/inventory/lots?expiringSoon=true'),
          apiClient.get('/appointments?status=pending&limit=5'),
        ]);
        const fetchedAppointments =
          appointmentsRes.status === 'fulfilled' ? extractArrayData(appointmentsRes.value) : [];
        const appointments = Array.isArray(fetchedAppointments)
          ? fetchedAppointments.slice(0, 5)
          : [];
        const patientsData =
          patientsRes.status === 'fulfilled' ? extractArrayData(patientsRes.value, 'patients') : [];
        const recentPatients = Array.isArray(patientsData) ? patientsData.slice(0, 5) : [];
        const invoicesData =
          invoicesRes.status === 'fulfilled' ? extractArrayData(invoicesRes.value) : [];
        const overdueInvoices = Array.isArray(invoicesData) ? invoicesData.slice(0, 5) : [];
        const itemsArray =
          inventoryRes.status === 'fulfilled' ? extractArrayData(inventoryRes.value) || [] : [];
        const lowStockList = Array.isArray(itemsArray) ? itemsArray.slice(0, 5) : [];
        const prescriptionsData =
          prescriptionsRes.status === 'fulfilled' ? extractArrayData(prescriptionsRes.value) : [];
        const prescriptionRefills = Array.isArray(prescriptionsData)
          ? prescriptionsData.slice(0, 5)
          : [];
        const queueArray =
          queueRes.status === 'fulfilled' ? extractArrayData(queueRes.value) || [] : [];
        const queueList = Array.isArray(queueArray) ? queueArray : [];
        const active = queueList.filter(
          (q) => q.status === 'waiting' || q.status === 'in_progress'
        ).length;
        const waiting = queueList.filter((q) => q.status === 'waiting').length;
        const inProgress = queueList.filter((q) => q.status === 'in_progress').length;
        const queueStatus = { active, waiting, inProgress };
        const lotsArray =
          lotsRes.status === 'fulfilled' ? extractArrayData(lotsRes.value) || [] : [];
        const expiringLots = Array.isArray(lotsArray) ? lotsArray.slice(0, 5) : [];
        const requestsData =
          requestsRes.status === 'fulfilled' ? extractArrayData(requestsRes.value) : [];
        const appointmentRequests = Array.isArray(requestsData) ? requestsData.slice(0, 5) : [];
        const alerts = [];
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const urgentAppointments = Array.isArray(appointments)
          ? appointments.filter((apt) => {
              const aptTime = new Date(apt.appointmentDate || apt.date);
              return aptTime >= now && aptTime <= oneHourLater;
            })
          : [];
        if (urgentAppointments.length > 0) {
          alerts.push({
            type: 'appointment',
            severity: 'info',
            message: `${urgentAppointments.length} appointment(s) starting within the next hour`,
            count: urgentAppointments.length,
          });
        }
        if (overdueInvoices.length > 0) {
          alerts.push({
            type: 'invoice',
            severity: 'warning',
            message: `${overdueInvoices.length} overdue invoice(s) require attention`,
            count: overdueInvoices.length,
          });
        }
        if (lowStockList.length > 0) {
          alerts.push({
            type: 'inventory',
            severity: 'error',
            message: `${lowStockList.length} item(s) running low on stock`,
            count: lowStockList.length,
          });
        }
        if (expiringLots.length > 0) {
          alerts.push({
            type: 'lot',
            severity: 'warning',
            message: `${expiringLots.length} lot(s) expiring soon`,
            count: expiringLots.length,
          });
        }
        return {
          todayAppointments: appointments,
          recentPatients,
          overdueInvoices,
          lowStockList,
          prescriptionRefills,
          queueStatus,
          criticalAlerts: alerts,
          expiringLots,
          appointmentRequests,
        };
      }),
    {
      ...opts,
      revalidateOnFocus: opts.refetchOnFocus !== false,
      dedupingInterval: opts.staleTime ?? 30 * 1000,
      refetchInterval: tabVisible ? CRITICAL_POLL_MS : 0,
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
      revalidateOnFocus: opts.refetchOnFocus !== false,
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
