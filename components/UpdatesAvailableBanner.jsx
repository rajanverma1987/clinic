'use client';

/**
 * "Updates available" notification: show when background revalidation has new data.
 * Compact pill on the right with action button; user clicks to apply (refetch).
 */

import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/Button';

export function UpdatesAvailableBanner({ onRefresh, visible = false, className = '', compact = true }) {
  const { t } = useI18n();
  if (!visible) return null;

  if (compact) {
    return (
      <div
        role="status"
        className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg bg-primary-50 border border-primary-200 text-primary-800 text-sm shrink-0 ${className}`}
      >
        <span className="font-medium whitespace-nowrap">{t('common.updatesAvailable')}.</span>
        <Button variant="primary" size="sm" onClick={onRefresh} className="shrink-0">
          {t('common.refresh')}
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 py-2 px-4 bg-primary-50 border-b border-primary-200 text-primary-900 text-sm ${className}`}
    >
      <span>{t('common.updatesAvailable')}.</span>
      <Button variant="primary" size="sm" onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
    </div>
  );
}
