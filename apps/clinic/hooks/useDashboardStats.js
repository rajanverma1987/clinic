/**
 * Dashboard Stats Hook with Auto-Refresh
 * Enterprise: logger for errors (no console), safe error messages (no PHI).
 */

import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await apiClient.get('/dashboard/stats');
      if (response?.success === false) {
        const msg = response?.error?.message || 'Failed to load dashboard stats';
        logger.error('useDashboardStats fetch failed', { message: msg });
        setError(msg);
        return;
      }
      setStats(response?.data?.data ?? response?.data ?? null);
    } catch (err) {
      logger.error('useDashboardStats fetch failed', { message: err?.message });
      setError(err?.message || err?.error?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.post('/dashboard/stats/refresh');
      if (response?.success === false) {
        const msg = response?.error?.message || 'Failed to refresh stats';
        logger.error('useDashboardStats refresh failed', { message: msg });
        setError(msg);
        return;
      }
      setStats(response?.data?.data ?? response?.data ?? null);
    } catch (err) {
      logger.error('useDashboardStats refresh failed', { message: err?.message });
      setError(err?.message || err?.error?.message || 'Failed to refresh stats');
    }
  }, []);

  useEffect(() => {
    fetchStats(true);

    intervalRef.current = setInterval(() => {
      fetchStats(false);
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats]);

  return { stats, loading, error, refresh };
}
