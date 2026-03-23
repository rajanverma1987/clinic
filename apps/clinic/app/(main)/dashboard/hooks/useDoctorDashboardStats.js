import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Doctor dashboard stats. Direct API fetch when enabled.
 * When enabled is false (e.g. on Appointments/Prescriptions tab), no fetch runs.
 */
export function useDoctorDashboardStats({ enabled = true } = {}) {
  const { user } = useAuth();
  const userId = user?.role === 'doctor' ? (user?._id ?? user?.id ?? user?.userId ?? null) : null;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!user || !userId || userId === 'undefined') {
      setLoading(false);
      return Promise.resolve();
    }
    const role = (user.role || '').toLowerCase();
    if (role !== 'doctor') {
      setLoading(false);
      return Promise.resolve();
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/doctors/dashboard');

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      // Fetch failed
      setError(err);
      setStats({
        totalPatients: 0,
        todayAppointments: 0,
        thisWeekAppointments: 0,
        thisMonthAppointments: 0,
        pendingReviews: 0,
        patientsWaiting: 0,
        completedConsultations: 0,
        revenue: 0,
        earningsToday: 0,
        revenueTrend: 0,
        appointmentsTrend: 0,
        patientsTrend: 0,
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        videoCallsThisMonth: 0,
        labReportsToReview: 0,
        newMessages: 0,
        prescriptionsToApprove: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    if (!enabled || !userId || userId === 'undefined' || (user?.role || '').toLowerCase() !== 'doctor')
      return;
    fetchStats();
  }, [enabled, userId, user?.role, fetchStats]);

  return { stats, loading, error, fetchStats };
}
