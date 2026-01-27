import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/reports/dashboard');
      if (response.success && response.data) {
        setStats(response.data);
        // Calculate patients summary if not provided
        if (!response.data.patientsSummary) {
          const newPatients = response.data.newPatientsThisMonth || 0;
          const totalPatients = response.data.activePatients || 0;
          const oldPatients = Math.max(0, totalPatients - newPatients);
          setStats((prev) => ({
            ...prev,
            patientsSummary: {
              newPatients,
              oldPatients,
              totalPatients,
            },
          }));
        }
      } else {
        // If response is not successful, set default stats
        setStats({
          todayAppointments: 0,
          todayRevenue: 0,
          activePatients: 0,
          newPatientsThisMonth: 0,
          completedToday: 0,
          pendingInvoices: 0,
        });
        setError(response.error || new Error('Failed to fetch stats'));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err);
      // Set default stats on error so page can still render
      setStats({
        todayAppointments: 0,
        todayRevenue: 0,
        activePatients: 0,
        newPatientsThisMonth: 0,
        completedToday: 0,
        pendingInvoices: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats };
}
