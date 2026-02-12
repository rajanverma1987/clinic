'use client';

/**
 * When back online, replay queued mutations (logged when offline).
 * Shows a success toast when actions are synced.
 */

import { replayOfflineQueue } from '@/lib/api/offline-queue';
import { showSuccess } from '@/lib/utils/toast';
import { useEffect } from 'react';

export function OfflineReplay() {
  useEffect(() => {
    const handleOnline = () => {
      replayOfflineQueue().then(({ replayed }) => {
        if (replayed > 0) {
          window.dispatchEvent(new CustomEvent('offline-queue-replayed', { detail: { replayed } }));
          const msg = `${replayed} action${replayed > 1 ? 's' : ''} synced successfully.`;
          showSuccess(msg);
        }
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  return null;
}
