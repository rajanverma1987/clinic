/**
 * Dashboard Stats Hook with Auto-Refresh
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 */

import { apiClient } from '@/lib/api/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardStats({ enabled = true } = {}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(enabled);
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
    // Skip entirely when disabled (e.g. doctor role doesn't use this endpoint)
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchStats(true);

    // Poll only when the browser tab is visible to avoid unnecessary background traffic.
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchStats(false);
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, enabled]);

  return { stats, loading, error, refresh, forceRefresh: refresh };
}
