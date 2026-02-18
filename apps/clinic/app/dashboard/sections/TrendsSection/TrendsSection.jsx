'use client';

/**
 * TrendsSection – Client component. Fetches from /api/dashboard/trends via SWR.
 * CursorMD/new fix.md: TrendsSection uses SWR.
 */

import { apiClient } from '@/lib/api/client';
import { useI18n } from '@/contexts/I18nContext';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { CurrencyIcon, UsersIcon } from '@/components/icons';

const TRENDS_KEY = 'dashboard-trends';
const TRENDS_STALE_MS = 5 * 60 * 1000;

async function fetchTrends() {
  const res = await apiClient.get('/dashboard/trends?period=day');
  if (res?.success && res?.data) return res.data;
  return { revenue: null, patientFlow: null };
}

export function TrendsSection({ tenantId, children, className = '' }) {
  const { t } = useI18n();
  const { data, error, isLoading, mutate } = useSWR(
    tenantId ? [TRENDS_KEY, tenantId] : null,
    () => fetchTrends(),
    { revalidateOnFocus: false, dedupingInterval: TRENDS_STALE_MS }
  );

  const revenue = data?.revenue;
  const patientFlow = data?.patientFlow;

  return (
    <section className={`dashboard-section ${className}`}>
      {children}
      {tenantId && (
        <div className='grid grid-cols-1 sm:grid-cols-2 dashboard-grid gap-4'>
          <Card className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <CurrencyIcon className='icon icon-sm text-primary-500' aria-hidden />
              <span className='font-medium'>{t('admin.revenueTrend') || 'Revenue Trend'}</span>
            </div>
            {isLoading && <div className='skeleton skeleton-text w-20 h-8' />}
            {!isLoading && revenue && (
              <div>
                <span className='text-lg font-semibold'>{revenue.trendPercent >= 0 ? '+' : ''}{revenue.trendPercent}%</span>
                <span className='text-body-sm text-neutral-500 ml-2'>
                  vs {revenue.period === 'day' ? 'yesterday' : revenue.period}
                </span>
              </div>
            )}
            {!isLoading && error && <span className='text-body-sm text-status-error'>{t('errors.loadFailed') || 'Load failed'}</span>}
          </Card>
          <Card className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <UsersIcon className='icon icon-sm text-primary-500' aria-hidden />
              <span className='font-medium'>{t('dashboard.patientsSummary') || 'Patient Flow'}</span>
            </div>
            {isLoading && <div className='skeleton skeleton-text w-20 h-8' />}
            {!isLoading && patientFlow && (
              <div>
                <span className='text-lg font-semibold'>{patientFlow.newPatients} new</span>
                <span className='text-body-sm text-neutral-500 ml-2'>
                  ({patientFlow.trendPercent >= 0 ? '+' : ''}{patientFlow.trendPercent}% vs prev {patientFlow.period})
                </span>
              </div>
            )}
            {!isLoading && error && <span className='text-body-sm text-status-error'>{t('errors.loadFailed') || 'Load failed'}</span>}
          </Card>
        </div>
      )}
    </section>
  );
}
