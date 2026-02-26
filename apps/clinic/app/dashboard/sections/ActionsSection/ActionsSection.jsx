'use client';

/**
 * ActionsSection – Client component. Dashboard actions: Retry failed payments (Assign Staff removed from Overview).
 * Calls /api/dashboard/actions. CursorMD/new fix.md: ActionsSection → Client Component.
 */

import { RefreshCwIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';

export function ActionsSection({ failedTransactions = 0, children, className = '' }) {
  const { t } = useI18n();
  const showRetryFailed = failedTransactions > 0;

  if (!showRetryFailed && !children) return null;

  return (
    <section className={`dashboard-section ${className}`}>
      {showRetryFailed && (
        <div className='flex flex-wrap gap-3'>
          <Link href='/invoices?filter=failed'>
            <Button variant='secondary' size='sm' className='inline-flex items-center gap-2'>
              <RefreshCwIcon className='icon icon-sm' aria-hidden />
              {t('dashboard.retryFailedPaymentsCount', { count: failedTransactions })}
            </Button>
          </Link>
        </div>
      )}
      {children}
    </section>
  );
}
