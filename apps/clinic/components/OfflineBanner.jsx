'use client';

/**
 * Offline mode indicator: shows when navigator.onLine is false.
 * Stale data with warning banner during connection issues.
 */

import { useEffect, useState } from 'react';

export function OfflineBanner({ className = '' }) {
  // Same initial value on server and client to avoid hydration mismatch (navigator is undefined on server)
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role='alert'
      className={`flex items-center justify-center gap-2 py-2 px-4 bg-amber-100 border-b border-amber-200 text-amber-900 text-sm ${className}`}
    >
      <span className='inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse' />
      You are offline. Data may be stale. Changes will sync when you reconnect.
    </div>
  );
}
