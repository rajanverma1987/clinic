'use client';

/**
 * "Updates available" notification: show when background revalidation has new data.
 * Renders fixed bottom-left, very compact, so it doesn't block work.
 */

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';

export function UpdatesAvailableBanner({ onRefresh, visible = false, className = '' }) {
  const { t } = useI18n();
  if (!visible) return null;

  return (
    <div
      role='status'
      className={`fixed left-3 bottom-3 z-[10060] rounded-lg bg-primary-50/95 border border-primary-200 shadow-sm backdrop-blur-sm ${className}`}
      aria-live='polite'
    >
      <div className='inline-flex items-center gap-1.5 py-1 px-2 rounded-lg text-primary-800'>
        <span className='text-xs font-medium whitespace-nowrap'>
          {t('common.updatesAvailable')}.
        </span>
        <Button
          variant='primary'
          size='xs'
          onClick={onRefresh}
          className='shrink-0 !min-h-[28px] !py-1 !px-2.5 text-xs'
        >
          {t('common.refresh')}
        </Button>
      </div>
    </div>
  );
}
