/**
 * Incremental Appointments Hook
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec exactly.
 */

import { apiClient } from '@/lib/api/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useIncrementalAppointments({ limit, status } = {}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastUpdateRef = useRef(null);

  // Use primitive deps (limit, status) instead of the filters object so the
  // callback is only recreated when values actually change, not on every parent render.
  const fetchAppointments = useCallback(
    async (isIncremental = false) => {
      try {
        const params = {};
        if (limit != null) params.limit = limit;
        if (status != null) params.status = status;

        if (isIncremental && lastUpdateRef.current) {
          params.since = lastUpdateRef.current;
        }

        const response = await apiClient.get('/appointments', { params });
        const { data, isIncremental: wasIncremental, timestamp } = response.data;

        if (wasIncremental) {
          setAppointments((prev) => {
            const map = new Map(prev.map((a) => [a._id, a]));
            data.forEach((item) => map.set(item._id, item));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
            );
          });
        } else {
          setAppointments(data);
        }

        lastUpdateRef.current = timestamp;
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError(err.message);
        setLoading(false);
      }
    },
    [limit, status],
  );

  const refresh = useCallback(() => {
    lastUpdateRef.current = null;
    fetchAppointments(false);
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments(false);

    // Stop polling when the browser tab is hidden to save network/battery.
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchAppointments(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAppointments]);

  return { appointments, loading, error, refresh };
}
