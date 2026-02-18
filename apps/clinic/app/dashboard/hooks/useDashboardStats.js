/**
 * Dashboard Stats Hook with Auto-Refresh
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 * Subscribes to dashboard-events (new appointment, payment failure, staff assignment) to refresh stats.
 */

import { apiClient } from '@/lib/api/client';
import { onRealtimeEvent } from '@/lib/realtime/realtime-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDashboardStats({ enabled = true } = {}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // CursorMD/new fix.md: KPISection uses /api/dashboard/summary – instant from clinic_dashboard_metrics
      const response = await apiClient.get('/dashboard/summary');
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

    const unsubDashboard = onRealtimeEvent('dashboard-events', () => fetchStats(false));
    const unsubPaymentFailed = onRealtimeEvent('payment:failed', () => fetchStats(false));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubDashboard();
      unsubPaymentFailed();
    };
  }, [fetchStats, enabled]);

  return { stats, loading, error, fetchStats, refresh, forceRefresh: refresh };
}
