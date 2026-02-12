/**
 * Hook for adaptive polling
 * Adjusts polling interval based on whether data has changed.
 * Reduces unnecessary requests when data is static.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for adaptive polling with exponential backoff
 * @param {Function} fetchFn - Function to fetch data
 * @param {Object} options - Polling options
 * @param {number} options.initialInterval - Initial polling interval in milliseconds (default: 60000)
 * @param {number} options.maxInterval - Maximum polling interval in milliseconds (default: 300000)
 * @param {number} options.backoffMultiplier - Multiplier for interval when no changes (default: 1.5)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @returns {Object} Object containing data, loading, error, refresh function, and currentInterval
 */
export function useAdaptivePolling(fetchFn, options = {}) {
  const {
    initialInterval = 60000, // 1 minute
    maxInterval = 300000, // 5 minutes
    backoffMultiplier = 1.5,
    enabled = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(initialInterval);
  const lastDataRef = useRef(null);
  const timeoutRef = useRef(null);

  const poll = useCallback(
    async () => {
      if (!enabled) return;

      try {
        setLoading(true);
        const newData = await fetchFn();

        // Check if data changed
        const dataString = JSON.stringify(newData);
        const hasChanges = dataString !== lastDataRef.current;

        if (hasChanges) {
          // Reset interval on changes
          intervalRef.current = initialInterval;
          setData(newData);
          lastDataRef.current = dataString;
        } else {
          // Increase interval if no changes (exponential backoff)
          intervalRef.current = Math.min(
            intervalRef.current * backoffMultiplier,
            maxInterval,
          );
        }

        setError(null);
        setLoading(false);

        // Schedule next poll
        timeoutRef.current = setTimeout(poll, intervalRef.current);
      } catch (err) {
        logger.error('Polling error:', err);
        setError(err);
        setLoading(false);

        // Retry with increased interval on error
        intervalRef.current = Math.min(
          intervalRef.current * backoffMultiplier,
          maxInterval,
        );
        timeoutRef.current = setTimeout(poll, intervalRef.current);
      }
    },
    [fetchFn, enabled, initialInterval, maxInterval, backoffMultiplier],
  );

  const refresh = useCallback(() => {
    intervalRef.current = initialInterval;
    lastDataRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    poll();
  }, [poll, initialInterval]);

  useEffect(() => {
    if (enabled) {
      poll();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [poll, enabled]);

  return { data, loading, error, refresh, currentInterval: intervalRef.current };
}
