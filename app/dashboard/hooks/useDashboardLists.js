import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import * as dashboardCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Clinic dashboard lists – all list endpoints in parallel.
 * Cache-first: when returning to Dashboard, show last data immediately (no loading).
 */
export function useDashboardLists() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? null;

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [prescriptionRefills, setPrescriptionRefills] = useState([]);
  const [queueStatus, setQueueStatus] = useState({ active: 0, waiting: 0, inProgress: 0 });
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [expiringLots, setExpiringLots] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = dashboardCache.getData('lists', tenantId);
    if (cached && typeof cached === 'object') {
      setTodayAppointments(cached.todayAppointments ?? []);
      setRecentPatients(cached.recentPatients ?? []);
      setOverdueInvoices(cached.overdueInvoices ?? []);
      setLowStockList(cached.lowStockList ?? []);
      setPrescriptionRefills(cached.prescriptionRefills ?? []);
      setQueueStatus(cached.queueStatus ?? { active: 0, waiting: 0, inProgress: 0 });
      setCriticalAlerts(cached.criticalAlerts ?? []);
      setExpiringLots(cached.expiringLots ?? []);
      setAppointmentRequests(cached.appointmentRequests ?? []);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchDashboardLists = useCallback(async () => {
    const cacheKey = tenantId ?? 'clinic';
    const cached = dashboardCache.getData('lists', cacheKey);
    const isBackgroundRevalidate = !!cached;

    try {
      if (!isBackgroundRevalidate) setLoading(true);
      setError(null);
      if (!isBackgroundRevalidate) setCriticalAlerts([]);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Fire all list requests in parallel (one network round-trip)
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

      const alerts = [];

      // Appointments
      const fetchedAppointmentsData =
        appointmentsRes.status === 'fulfilled' ? extractArrayData(appointmentsRes.value) : [];
      const fetchedAppointments = Array.isArray(fetchedAppointmentsData)
        ? fetchedAppointmentsData.slice(0, 5)
        : [];
      setTodayAppointments(fetchedAppointments);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const urgentAppointments = Array.isArray(fetchedAppointments)
        ? fetchedAppointments.filter((apt) => {
            const aptTime = new Date(apt.appointmentDate || apt.date);
            return aptTime >= now && aptTime <= oneHourLater;
          })
        : [];
      if (urgentAppointments.length > 0) {
        alerts.push({
          type: 'appointment',
          severity: 'info',
          message: `${urgentAppointments.length} appointment${urgentAppointments.length > 1 ? 's' : ''} starting within the next hour`,
          count: urgentAppointments.length,
        });
      }

      // Recent patients
      const patientsData =
        patientsRes.status === 'fulfilled' ? extractArrayData(patientsRes.value, 'patients') : [];
      setRecentPatients(Array.isArray(patientsData) ? patientsData.slice(0, 5) : []);

      // Overdue invoices
      const invoicesData =
        invoicesRes.status === 'fulfilled' ? extractArrayData(invoicesRes.value) : [];
      const invoices = Array.isArray(invoicesData) ? invoicesData.slice(0, 5) : [];
      setOverdueInvoices(invoices);
      if (invoices.length > 0) {
        alerts.push({
          type: 'invoice',
          severity: 'warning',
          message: `${invoices.length} overdue invoice${invoices.length > 1 ? 's' : ''} require attention`,
          count: invoices.length,
        });
      }

      // Low stock
      const itemsArray =
        inventoryRes.status === 'fulfilled' ? extractArrayData(inventoryRes.value) || [] : [];
      const itemsList = Array.isArray(itemsArray) ? itemsArray.slice(0, 5) : [];
      setLowStockList(itemsList);
      if (itemsList.length > 0) {
        alerts.push({
          type: 'inventory',
          severity: 'error',
          message: `${itemsList.length} item${itemsList.length > 1 ? 's' : ''} running low on stock`,
          count: itemsList.length,
        });
      }

      // Prescription refills
      const prescriptionsData =
        prescriptionsRes.status === 'fulfilled' ? extractArrayData(prescriptionsRes.value) : [];
      setPrescriptionRefills(Array.isArray(prescriptionsData) ? prescriptionsData.slice(0, 5) : []);

      // Queue status
      const queueArray =
        queueRes.status === 'fulfilled' ? extractArrayData(queueRes.value) || [] : [];
      const queueList = Array.isArray(queueArray) ? queueArray : [];
      const active = queueList.filter(
        (q) => q.status === 'waiting' || q.status === 'in_progress'
      ).length;
      const waiting = queueList.filter((q) => q.status === 'waiting').length;
      const inProgress = queueList.filter((q) => q.status === 'in_progress').length;
      setQueueStatus({ active, waiting, inProgress });

      // Expiring lots
      const lotsArray = lotsRes.status === 'fulfilled' ? extractArrayData(lotsRes.value) || [] : [];
      const lotsList = Array.isArray(lotsArray) ? lotsArray.slice(0, 5) : [];
      setExpiringLots(lotsList);
      if (lotsList.length > 0) {
        alerts.push({
          type: 'lot',
          severity: 'warning',
          message: `${lotsList.length} lot${lotsList.length > 1 ? 's' : ''} expiring soon`,
          count: lotsList.length,
        });
      }

      // Appointment requests
      const requestsData =
        requestsRes.status === 'fulfilled' ? extractArrayData(requestsRes.value) : [];
      const requestsList = Array.isArray(requestsData) ? requestsData.slice(0, 5) : [];
      setAppointmentRequests(requestsList);

      setCriticalAlerts(alerts);

      const payload = {
        todayAppointments: fetchedAppointments,
        recentPatients: Array.isArray(patientsData) ? patientsData.slice(0, 5) : [],
        overdueInvoices: invoices,
        lowStockList: itemsList,
        prescriptionRefills: Array.isArray(prescriptionsData) ? prescriptionsData.slice(0, 5) : [],
        queueStatus: { active, waiting, inProgress },
        criticalAlerts: alerts,
        expiringLots: lotsList,
        appointmentRequests: requestsList,
      };
      dashboardCache.set('lists', cacheKey, payload);
    } catch (err) {
      // Fetch failed
      setError(err);
      setCriticalAlerts([]);
      setTodayAppointments([]);
      setRecentPatients([]);
      setOverdueInvoices([]);
      setLowStockList([]);
      setPrescriptionRefills([]);
      setQueueStatus({ active: 0, waiting: 0, inProgress: 0 });
      setExpiringLots([]);
      setAppointmentRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  return {
    todayAppointments,
    recentPatients,
    overdueInvoices,
    lowStockList,
    prescriptionRefills,
    queueStatus,
    criticalAlerts,
    expiringLots,
    appointmentRequests,
    loading,
    error,
    fetchDashboardLists,
  };
}
