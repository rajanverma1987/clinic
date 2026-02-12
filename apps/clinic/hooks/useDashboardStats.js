/**
 * Dashboard Stats Hook with Auto-Refresh
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 */

import { apiClient } from '@/lib/api/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await apiClient.post('/dashboard/stats/refresh');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
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
