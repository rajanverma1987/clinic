import { apiClient } from '@/lib/api/client';
import { useCallback, useState } from 'react';
import { extractArrayData } from '@/lib/utils/api-response-extractor';

export function useDashboardLists() {
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

  const fetchDashboardLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCriticalAlerts([]); // Reset alerts at start

      const alerts = []; // Build alerts array

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await apiClient.get(`/appointments?date=${today}&limit=5`);
      const fetchedAppointmentsData = extractArrayData(appointmentsResponse);
      const fetchedAppointments = Array.isArray(fetchedAppointmentsData) ? fetchedAppointmentsData.slice(0, 5) : [];
      setTodayAppointments(fetchedAppointments);

      // Check for urgent appointments (within next hour) and add to alerts
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const urgentAppointments = Array.isArray(fetchedAppointments) ? fetchedAppointments.filter((apt) => {
        const aptTime = new Date(apt.appointmentDate || apt.date);
        return aptTime >= now && aptTime <= oneHourLater;
      }) : [];
      if (urgentAppointments.length > 0) {
        alerts.push({
          type: 'appointment',
          severity: 'info',
          message: `${urgentAppointments.length} appointment${
            urgentAppointments.length > 1 ? 's' : ''
          } starting within the next hour`,
          count: urgentAppointments.length,
        });
      }

      // Fetch recent patients
      try {
        const patientsResponse = await apiClient.get(
          '/patients?limit=5&sortBy=createdAt&sortOrder=desc'
        );
        const patientsData = extractArrayData(patientsResponse, 'patients');
        setRecentPatients(Array.isArray(patientsData) ? patientsData.slice(0, 5) : []);
      } catch (err) {
        console.error('Failed to fetch recent patients:', err);
        setRecentPatients([]);
      }

      // Fetch overdue invoices
      try {
        const invoicesResponse = await apiClient.get('/invoices?status=pending&overdue=true&limit=5');
        const invoicesData = extractArrayData(invoicesResponse);
        const invoices = Array.isArray(invoicesData) ? invoicesData.slice(0, 5) : [];
        setOverdueInvoices(invoices);

        // Add to alerts
        if (invoices.length > 0) {
          alerts.push({
            type: 'invoice',
            severity: 'warning',
            message: `${invoices.length} overdue invoice${
              invoices.length > 1 ? 's' : ''
            } require attention`,
            count: invoices.length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch overdue invoices:', err);
        setOverdueInvoices([]);
      }

      // Fetch low stock items
      try {
        const inventoryResponse = await apiClient.get('/inventory/items?lowStock=true&limit=5');
        const items = extractArrayData(inventoryResponse);
        const itemsArray = Array.isArray(items) ? items : [];
        
        if (itemsArray.length > 0) {
          setLowStockList(itemsArray.slice(0, 5));
          // Add to alerts
          alerts.push({
            type: 'inventory',
            severity: 'error',
            message: `${itemsArray.length} item${itemsArray.length > 1 ? 's' : ''} running low on stock`,
            count: itemsArray.length,
          });
        } else {
          setLowStockList([]);
        }
      } catch (err) {
        console.error('Failed to fetch low stock items:', err);
        setLowStockList([]);
      }

      // Fetch prescription refills due
      try {
        const prescriptionsResponse = await apiClient.get('/prescriptions?status=active&limit=5');
        const prescriptionsData = extractArrayData(prescriptionsResponse);
        const prescriptions = Array.isArray(prescriptionsData) ? prescriptionsData : [];
        setPrescriptionRefills(prescriptions.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch prescription refills:', err);
        setPrescriptionRefills([]);
      }

      // Fetch queue status
      try {
        const queueResponse = await apiClient.get('/queue?status=waiting&limit=100');
        const queueData = extractArrayData(queueResponse);
        const queueArray = Array.isArray(queueData) ? queueData : [];
        const active = queueArray.filter(
          (q) => q.status === 'waiting' || q.status === 'in_progress'
        ).length;
        const waiting = queueArray.filter((q) => q.status === 'waiting').length;
        const inProgress = queueArray.filter((q) => q.status === 'in_progress').length;
        setQueueStatus({ active, waiting, inProgress });
      } catch (err) {
        console.error('Failed to fetch queue status:', err);
        setQueueStatus({ active: 0, waiting: 0, inProgress: 0 });
      }

      // Fetch expiring lots
      try {
        const lotsResponse = await apiClient.get('/inventory/lots?expiringSoon=true');
        const lots = extractArrayData(lotsResponse);
        const lotsArray = Array.isArray(lots) ? lots : [];
        setExpiringLots(lotsArray.slice(0, 5));

        // Add to alerts if there are expiring lots
        if (lotsArray.length > 0) {
          alerts.push({
            type: 'lot',
            severity: 'warning',
            message: `${lotsArray.length} lot${lotsArray.length > 1 ? 's' : ''} expiring soon`,
            count: lotsArray.length,
          });
        }
      } catch (err) {
        console.error('Failed to fetch expiring lots:', err);
        setExpiringLots([]);
      }

      // Fetch appointment requests (pending appointments)
      try {
        const requestsResponse = await apiClient.get('/appointments?status=pending&limit=5');
        const requestsData = extractArrayData(requestsResponse);
        const requests = Array.isArray(requestsData) ? requestsData : [];
        setAppointmentRequests(requests.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch appointment requests:', err);
        setAppointmentRequests([]);
      }

      // Set all alerts at once at the end
      setCriticalAlerts(alerts);
    } catch (err) {
      console.error('Failed to fetch dashboard lists:', err);
      setError(err);
      setCriticalAlerts([]); // Clear alerts on error
      // Ensure all lists have default values so page can render
      setTodayAppointments([]);
      setRecentPatients([]);
      setOverdueInvoices([]);
      setLowStockList([]);
      setPrescriptionRefills([]);
      setQueueStatus({ active: 0, waiting: 0, inProgress: 0 });
      setExpiringLots([]);
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
    expiringLots,
    appointmentRequests,
    loading,
    error,
    fetchDashboardLists,
  };
}
