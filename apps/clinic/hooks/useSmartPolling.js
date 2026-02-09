'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

const MAX_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min cap on backoff

/**
 * SWR with smart polling: pause when tab is hidden, exponential backoff on errors.
 *
 * @param {string|string[]} key - SWR key (null to disable)
 * @param {() => Promise<any>} fetcher - Async function that returns data
 * @param {object} [options]
 * @param {number} [options.baseIntervalMs=30000] - Poll interval when healthy
 * @param {boolean} [options.refetchIntervalInBackground=false] - Set false so we pause when hidden
 */
export function useSmartPolling(key, fetcher, options = {}) {
  const { baseIntervalMs = 30000, refetchIntervalInBackground = false } = options;
  const failureCountRef = useRef(0);
  const [isTabActive, setIsTabActive] = useState(
    typeof document !== 'undefined' ? !document.hidden : true,
  );

  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const wrappedFetcher = useCallback(
    async (...args) => {
      try {
        const result = await fetcher(...args);
        failureCountRef.current = 0;
        return result;
      } catch (err) {
        failureCountRef.current += 1;
        throw err;
      }
    },
    [fetcher],
  );

  const refetchInterval = useCallback(() => {
    if (!isTabActive) return 0;
    if (failureCountRef.current > 0) {
      return Math.min(baseIntervalMs * Math.pow(2, failureCountRef.current), MAX_POLL_INTERVAL_MS);
    }
    return baseIntervalMs;
  }, [isTabActive, baseIntervalMs]);

  return useSWR(key, wrappedFetcher, {
    ...options,
    refetchInterval,
    refetchIntervalInBackground,
  });
}
