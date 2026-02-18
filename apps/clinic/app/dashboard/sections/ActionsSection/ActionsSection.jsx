'use client';

/**
 * ActionsSection – Client component. Dashboard actions: Assign Staff, Retry failed payments.
 * Calls /api/dashboard/actions. CursorMD/new fix.md: ActionsSection → Client Component.
 */

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { UserAddIcon, RefreshCwIcon } from '@/components/icons';
import Link from 'next/link';

const CAN_ASSIGN_STAFF_ROLES = ['doctor', 'clinic_admin', 'super_admin'];

export function ActionsSection({ failedTransactions = 0, children, className = '' }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const canAssignStaff = user?.role && CAN_ASSIGN_STAFF_ROLES.includes(user.role);

  const showAssignStaff = canAssignStaff;
  const showRetryFailed = failedTransactions > 0;

  if (!showAssignStaff && !showRetryFailed && !children) return null;

  return (
    <section className={`dashboard-section ${className}`}>
      {(showAssignStaff || showRetryFailed) && (
        <div className='flex flex-wrap gap-3'>
          {showAssignStaff && (
            <Link href='/staff'>
              <Button variant='secondary' size='sm' className='inline-flex items-center gap-2'>
                <UserAddIcon className='icon icon-sm' aria-hidden />
                {t('dashboard.assignStaff') || 'Assign Staff'}
              </Button>
            </Link>
          )}
          {showRetryFailed && (
            <Link href='/invoices?filter=failed'>
              <Button variant='secondary' size='sm' className='inline-flex items-center gap-2'>
                <RefreshCwIcon className='icon icon-sm' aria-hidden />
                {t('dashboard.retryFailedPayments') || `Retry ${failedTransactions} failed payment${failedTransactions > 1 ? 's' : ''}`}
              </Button>
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
