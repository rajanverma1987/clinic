'use client';

/**
 * "Updates available" notification: show when background revalidation has new data.
 * User can click to apply (refetch) instead of auto-applying all changes.
 */

import { Button } from '@/components/ui/Button';

export function UpdatesAvailableBanner({ onRefresh, visible = false, className = '' }) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 py-2 px-4 bg-primary-50 border-b border-primary-200 text-primary-900 text-sm ${className}`}
    >
      <span>Updates available.</span>
      <Button variant="primary" size="sm" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
}
