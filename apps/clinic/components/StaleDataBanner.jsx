'use client';

import { Button } from '@/components/ui/Button';

/**
 * Show stale data with warning banner during connection issues.
 * Display when we have cached data but the latest revalidate failed (error).
 */
export function StaleDataBanner({ visible = false, onRetry, className = '' }) {
  if (!visible) return null;
  return (
    <div
      role='alert'
      className={`flex items-center justify-center gap-3 py-2 px-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm ${className}`}
    >
      <span>Showing cached data. Connection issue.</span>
      {onRetry && (
        <Button type='button' variant='link' size='xs' onClick={onRetry} className='font-medium text-amber-900 hover:opacity-80'>
          Retry
        </Button>
      )}
    </div>
  );
}
