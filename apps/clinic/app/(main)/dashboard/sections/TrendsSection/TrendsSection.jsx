'use client';

/**
 * TrendsSection – Client component. Uses trends from /api/dashboard/all when provided;
 * otherwise falls back to /api/dashboard/trends via SWR (e.g. when used outside dashboard page).
 */

import { CurrencyIcon, UsersIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import useSWR from 'swr';

const TRENDS_KEY = 'dashboard-trends';
const TRENDS_STALE_MS = 5 * 60 * 1000;

async function fetchTrends() {
  const res = await apiClient.get('/dashboard/trends?period=day');
  if (res?.success && res?.data) return res.data;
  return { revenue: null, patientFlow: null };
}

export function TrendsSection({ tenantId, trends: trendsProp, children, className = '' }) {
  const { t } = useI18n();
  const hasTrendsFromAll =
    trendsProp != null && (trendsProp.revenue != null || trendsProp.patientFlow != null);
  const { data, error, isLoading, mutate } = useSWR(
    !hasTrendsFromAll && tenantId ? [TRENDS_KEY, tenantId] : null,
    () => fetchTrends(),
    { revalidateOnFocus: false, dedupingInterval: TRENDS_STALE_MS },
  );

  const revenue = hasTrendsFromAll ? trendsProp?.revenue : data?.revenue;
  const patientFlow = hasTrendsFromAll ? trendsProp?.patientFlow : data?.patientFlow;
  const loading = hasTrendsFromAll ? false : isLoading;

  return (
    <section className={`dashboard-section ${className}`}>
      {children}
      {tenantId && (
        <div className='grid grid-cols-1 sm:grid-cols-2 dashboard-grid gap-4'>
          <Card className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <CurrencyIcon className='icon icon-sm text-primary-500' aria-hidden />
              <span className='font-medium'>{t('admin.revenueTrend')}</span>
            </div>
            {loading && <div className='skeleton skeleton-text w-20 h-8' />}
            {!loading && revenue && (
              <div>
                <span className='text-lg font-semibold'>
                  {revenue.trendPercent >= 0 ? '+' : ''}
                  {revenue.trendPercent}%
                </span>
                <span className='text-body-sm text-neutral-500 ml-2'>
                  {revenue.period === 'day'
                    ? t('dashboard.vsYesterday')
                    : t(`dashboard.vs${(revenue.period || 'day').charAt(0).toUpperCase()}${(revenue.period || '').slice(1)}`)}
                </span>
              </div>
            )}
            {!loading && error && (
              <span className='text-body-sm text-status-error'>
                {t('errors.loadFailed')}
              </span>
            )}
          </Card>
          <Card className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <UsersIcon className='icon icon-sm text-primary-500' aria-hidden />
              <span className='font-medium'>
                {t('dashboard.patientsSummary')}
              </span>
            </div>
            {loading && <div className='skeleton skeleton-text w-20 h-8' />}
            {!loading && patientFlow && (
              <div>
                <span className='text-lg font-semibold'>
                  {patientFlow.newPatients} {t('dashboard.newLabel')}
                </span>
                <span className='text-body-sm text-neutral-500 ml-2'>
                  ({patientFlow.trendPercent >= 0 ? '+' : ''}
                  {patientFlow.trendPercent}% {t(`dashboard.vsPrev${(patientFlow.period || 'day').charAt(0).toUpperCase()}${(patientFlow.period || '').slice(1)}`)})
                </span>
              </div>
            )}
            {!loading && error && (
              <span className='text-body-sm text-status-error'>
                {t('errors.loadFailed')}
              </span>
            )}
          </Card>
        </div>
      )}
    </section>
  );
}
