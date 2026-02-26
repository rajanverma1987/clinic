import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import * as dashboardCache from '@/lib/cache/dashboard-cache';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/**
 * Doctor dashboard stats. Cache-first: when returning to Dashboard, show last data (no loading).
 */
export function useDoctorDashboardStats() {
  const { user } = useAuth();
  const userId = user?.role === 'doctor' ? (user?._id ?? user?.id ?? user?.userId ?? null) : null;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }
    const cached = dashboardCache.getData('doctorStats', userId);
    if (cached) {
      setStats(cached);
      setLoading(false);
    }
  }, [userId]);

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

    const cached = dashboardCache.getData('doctorStats', userId);
    const isBackgroundRevalidate = !!cached;

    try {
      if (!isBackgroundRevalidate) setLoading(true);
      setError(null);

      const response = await apiClient.get('/doctors/dashboard');

      if (response.success && response.data) {
        setStats(response.data);
        dashboardCache.set('doctorStats', userId, response.data);
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

  // Trigger initial fetch when no cache (otherwise loading stays true forever)
  useEffect(() => {
    if (!userId || userId === 'undefined' || (user?.role || '').toLowerCase() !== 'doctor') return;
    const cached = dashboardCache.getData('doctorStats', userId);
    if (cached) return; // Cache already restored by useLayoutEffect; optional background revalidate via refresh interval
    fetchStats();
  }, [userId, user?.role, fetchStats]);

  return { stats, loading, error, fetchStats };
}
