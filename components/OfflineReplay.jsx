'use client';

/**
 * When back online, replay queued mutations (logged when offline).
 */

import { replayOfflineQueue } from '@/lib/api/offline-queue';
import { useEffect } from 'react';

export function OfflineReplay() {
  useEffect(() => {
    const handleOnline = () => {
      replayOfflineQueue().then(({ replayed }) => {
        if (replayed > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offline-queue-replayed', { detail: { replayed } }));
        }
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  return null;
}
