import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export function useDashboardCharts() {
  const [chartData, setChartData] = useState({
    revenue: null,
    appointments: null,
    patients: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Last 14 days

      // Fetch revenue trend
      try {
        const revenueParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const revenueResponse = await apiClient.get(`/reports/revenue?${revenueParams}`);
        if (revenueResponse.success && revenueResponse.data) {
          setChartData((prev) => ({
            ...prev,
            revenue: revenueResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch revenue chart:', err);
      }

      // Fetch appointment trend
      try {
        const appointmentParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const appointmentResponse = await apiClient.get(
          `/reports/appointments?${appointmentParams}`
        );
        if (appointmentResponse.success && appointmentResponse.data) {
          setChartData((prev) => ({
            ...prev,
            appointments: appointmentResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch appointment chart:', err);
      }

      // Fetch patient growth
      try {
        const patientParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
          includeNewPatients: 'true',
        });
        const patientResponse = await apiClient.get(`/reports/patients?${patientParams}`);
        if (patientResponse.success && patientResponse.data) {
          setChartData((prev) => ({
            ...prev,
            patients: patientResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch patient chart:', err);
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { chartData, loading, error, fetchChartData };
}
