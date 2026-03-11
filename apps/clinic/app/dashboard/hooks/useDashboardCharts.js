import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Clinic dashboard charts – direct API fetch.
 */
export function useDashboardCharts() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? null;

  const [chartData, setChartData] = useState({
    revenue: null,
    appointments: null,
    patients: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChartData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

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

      // Fire all chart requests in parallel (one network round-trip)
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

      setChartData({ revenue, appointments, patients });
    } catch (err) {
      // Fetch failed
      setError(err);
      setChartData({ revenue: [], appointments: [], patients: [] });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) setLoading(false);
    else fetchChartData();
  }, [tenantId, fetchChartData]);

  return { chartData, loading, error, fetchChartData };
}
