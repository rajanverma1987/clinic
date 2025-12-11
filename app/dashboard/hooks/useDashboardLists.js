import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export function useDashboardLists() {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [prescriptionRefills, setPrescriptionRefills] = useState([]);
  const [queueStatus, setQueueStatus] = useState({ active: 0, waiting: 0, inProgress: 0 });
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await apiClient.get(`/appointments?date=${today}&limit=5`);
      let fetchedAppointments = [];
      if (appointmentsResponse.success && appointmentsResponse.data) {
        const appointmentsData =
          appointmentsResponse.data?.data || appointmentsResponse.data || [];
        fetchedAppointments = appointmentsData.slice(0, 5);
        setTodayAppointments(fetchedAppointments);

        // Check for urgent appointments (within next hour) and add to alerts
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const urgentAppointments = fetchedAppointments.filter((apt) => {
          const aptTime = new Date(apt.appointmentDate || apt.date);
          return aptTime >= now && aptTime <= oneHourLater;
        });
        if (urgentAppointments.length > 0) {
          setCriticalAlerts((prev) => [
            ...prev,
            {
              type: 'appointment',
              severity: 'info',
              message: `${urgentAppointments.length} appointment${
                urgentAppointments.length > 1 ? 's' : ''
              } starting within the next hour`,
              count: urgentAppointments.length,
            },
          ]);
        }
      }

      // Fetch recent patients
      const patientsResponse = await apiClient.get(
        '/patients?limit=5&sortBy=createdAt&sortOrder=desc'
      );
      if (patientsResponse.success && patientsResponse.data) {
        setRecentPatients(patientsResponse.data.slice(0, 5));
      }

      // Fetch overdue invoices
      const invoicesResponse = await apiClient.get('/invoices?status=pending&overdue=true&limit=5');
      if (invoicesResponse.success && invoicesResponse.data) {
        const invoices = invoicesResponse.data.slice(0, 5);
        setOverdueInvoices(invoices);

        // Add to alerts
        if (invoices.length > 0) {
          setCriticalAlerts((prev) => [
            ...prev,
            {
              type: 'invoice',
              severity: 'warning',
              message: `${invoices.length} overdue invoice${invoices.length > 1 ? 's' : ''} require attention`,
              count: invoices.length,
            },
          ]);
        }
      }

      // Fetch low stock items
      const inventoryResponse = await apiClient.get('/inventory/low-stock?limit=5');
      if (inventoryResponse.success && inventoryResponse.data) {
        const items = inventoryResponse.data.slice(0, 5);
        setLowStockList(items);

        // Add to alerts
        if (items.length > 0) {
          setCriticalAlerts((prev) => [
            ...prev,
            {
              type: 'inventory',
              severity: 'error',
              message: `${items.length} item${items.length > 1 ? 's' : ''} running low on stock`,
              count: items.length,
            },
          ]);
        }
      }

      // Fetch prescription refills due
      try {
        const prescriptionsResponse = await apiClient.get('/prescriptions?status=active&limit=5');
        if (prescriptionsResponse.success && prescriptionsResponse.data) {
          const prescriptions = prescriptionsResponse.data?.data || prescriptionsResponse.data || [];
          setPrescriptionRefills(prescriptions.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch prescription refills:', err);
      }

      // Fetch queue status
      try {
        const queueResponse = await apiClient.get('/queue?status=waiting&limit=100');
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data?.data || queueResponse.data || [];
          const active = queueData.filter(
            (q) => q.status === 'waiting' || q.status === 'in_progress'
          ).length;
          const waiting = queueData.filter((q) => q.status === 'waiting').length;
          const inProgress = queueData.filter((q) => q.status === 'in_progress').length;
          setQueueStatus({ active, waiting, inProgress });
        }
      } catch (err) {
        console.error('Failed to fetch queue status:', err);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard lists:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    todayAppointments,
    recentPatients,
    overdueInvoices,
    lowStockList,
    prescriptionRefills,
    queueStatus,
    criticalAlerts,
    loading,
    error,
    fetchDashboardLists,
  };
}
