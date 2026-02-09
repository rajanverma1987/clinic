'use client';

import { useEffect, useRef } from 'react';
import { onRealtimeEvent } from '@/lib/realtime/realtime-client';

const FLUSH_DELAY_MS = 2000;
const MAX_WAIT_MS = 5000;

/**
 * Batched dashboard realtime updates. Subscribes to appointment and queue events,
 * queues them, and calls onUpdate with the batch every 2s (or after 5s max wait).
 * Uses the shared realtime client (no extra socket). Cleanup on unmount.
 *
 * @param {(updates: { type: string; data: any }[]) => void} onUpdate - Called with batched updates
 */
export function useDashboardRealtime(onUpdate) {
  const updateQueue = useRef([]);
  const flushTimerRef = useRef(null);
  const maxWaitTimerRef = useRef(null);
  const lastFlushRef = useRef(0);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const flushUpdates = () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    if (updateQueue.current.length > 0) {
      const batch = updateQueue.current;
      updateQueue.current = [];
      lastFlushRef.current = Date.now();
      onUpdateRef.current(batch);
    }
  };

  const scheduleFlush = () => {
    if (updateQueue.current.length === 0) return;

    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flushUpdates, FLUSH_DELAY_MS);
    }
    // Max wait: flush at most 5s after first update in this batch
    if (updateQueue.current.length === 1 && !maxWaitTimerRef.current) {
      maxWaitTimerRef.current = setTimeout(flushUpdates, MAX_WAIT_MS);
    }
  };

  useEffect(() => {
    const push = (type, data) => {
      updateQueue.current.push({ type, data });
      scheduleFlush();
    };

    const unsubAppointment = onRealtimeEvent('appointment:updated', (data) =>
      push('appointment', data),
    );
    const unsubQueue = onRealtimeEvent('queue:updated', (data) => push('queue', data));
    const unsubQueueLegacy = onRealtimeEvent('queue.updated', (data) => push('queue', data));

    return () => {
      unsubAppointment();
      unsubQueue();
      unsubQueueLegacy();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
      flushTimerRef.current = null;
      maxWaitTimerRef.current = null;
    };
  }, []);
}
