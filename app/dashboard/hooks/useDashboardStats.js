import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import * as dashboardCache from '@/lib/cache/dashboard-cache';
import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Clinic dashboard stats. Cache-first: hydrate from localStorage in useLayoutEffect
 * (no hydration mismatch, no flash), then revalidate in background.
 */
export function useDashboardStats() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? null;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = dashboardCache.getData('stats', tenantId);
    if (cached) {
      setStats(cached);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchStats = useCallback(async () => {
    const cacheKey = tenantId ?? 'clinic';
    const cached = dashboardCache.getData('stats', cacheKey);
    const isBackgroundRevalidate = !!cached;

    try {
      if (!isBackgroundRevalidate) setLoading(true);
      setError(null);
      const response = await apiClient.get('/reports/dashboard');
      if (response.success && response.data) {
        let next = response.data;
        if (!next.patientsSummary) {
          const newPatients = next.newPatientsThisMonth || 0;
          const totalPatients = next.activePatients || 0;
          const oldPatients = Math.max(0, totalPatients - newPatients);
          next = {
            ...next,
            patientsSummary: { newPatients, oldPatients, totalPatients },
          };
        }
        setStats(next);
        dashboardCache.set('stats', cacheKey, next);
      } else {
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
      // Fetch failed
      setError(err);
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
  }, [tenantId]);

  return { stats, loading, error, fetchStats };
}
