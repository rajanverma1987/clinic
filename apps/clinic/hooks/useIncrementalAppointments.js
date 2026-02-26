/**
 * Incremental Appointments Hook
 * Enterprise: logger (no console), response.success check, safe error handling.
 */

import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useIncrementalAppointments({ limit, status, date, showCompletedIfEmpty = false } = {}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastUpdateRef = useRef(null);

  // Use primitive deps (limit, status, date) instead of the filters object so the
  // callback is only recreated when values actually change, not on every parent render.
  const fetchAppointments = useCallback(
    async (isIncremental = false) => {
      try {
        const params = {};
        if (limit != null) params.limit = limit;
        if (status != null) params.status = status;
        if (date != null) params.date = date;

        if (isIncremental && lastUpdateRef.current) {
          params.since = lastUpdateRef.current;
        }

        const response = await apiClient.get('/appointments', { params });
        if (response?.success === false) {
          const msg = response?.error?.message || 'Failed to fetch appointments';
          logger.error('useIncrementalAppointments fetch failed', { message: msg });
          setError(msg);
          setLoading(false);
          return;
        }
        const { data, isIncremental: wasIncremental, timestamp } = response?.data ?? {};

        let resultData = data || [];

        if (wasIncremental) {
          setAppointments((prev) => {
            const map = new Map(prev.map((a) => [a._id, a]));
            resultData.forEach((item) => map.set(item._id, item));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
            );
          });
        } else {
          // If no appointments found and showCompletedIfEmpty is true, fetch completed ones
          if (resultData.length === 0 && showCompletedIfEmpty && date) {
            const completedParams = { ...params, status: 'completed' };
            delete completedParams.since;
            const completedRes = await apiClient.get('/appointments', { params: completedParams });
            resultData = completedRes?.success !== false ? (completedRes?.data?.data ?? completedRes?.data ?? []) : [];
          }
          // Sort by appointment time (earliest first for today's schedule)
          resultData.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
          setAppointments(resultData);
        }

        lastUpdateRef.current = timestamp;
        setLoading(false);
        setError(null);
      } catch (err) {
        logger.error('useIncrementalAppointments failed', { message: err?.message });
        setError(err?.message || err?.error?.message || 'Failed to fetch appointments');
        setLoading(false);
      }
    },
    [limit, status, date, showCompletedIfEmpty],
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
