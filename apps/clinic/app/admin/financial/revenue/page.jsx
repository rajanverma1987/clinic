'use client';

import { ChartCard } from '@/app/dashboard/components/ChartCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminFinancialRevenuePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { currency, locale } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchRevenue();
    }
  }, [authLoading, user, startDate, endDate]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await apiClient.get(`/admin/financial/revenue?${params.toString()}`);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      logger.error('Failed to fetch revenue', err);
      showError(t('admin.failedToFetchRevenue'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => formatCurrencyUtil(amount ?? 0, currency, locale);

  if (user?.role !== 'super_admin' && !authLoading) return null;

  const overview = data?.overview ?? {};
  const breakdown = data?.breakdown ?? {};
  const revenueTrend = data?.revenueTrend ?? [];
  const topDoctors = data?.topDoctors ?? [];
  const contentLoading = authLoading || (loading && !data);

  return (
    <>
      <Card className='mb-6'>
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.revenueFromDate')}
              </label>
              <Input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.revenueToDate')}
              </label>
              <Input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className='flex items-end'>
              <Button variant='primary' onClick={fetchRevenue}>
                {t('admin.activityLogsApply')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {contentLoading ? (
        <div className='flex items-center justify-center min-h-[280px]' aria-busy='true'>
          <Loader type='section' text={t('common.loading')} />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500'>{t('admin.revenueTotalRevenue')}</p>
              <p className='text-2xl font-bold text-neutral-900'>
                {formatCurrency(overview.total)}
              </p>
            </Card>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500'>{t('admin.revenueCollected')}</p>
              <p className='text-2xl font-bold text-green-600'>
                {formatCurrency(overview.collected)}
              </p>
            </Card>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500'>{t('admin.revenuePending')}</p>
              <p className='text-2xl font-bold text-amber-600'>
                {formatCurrency(overview.pending)}
              </p>
            </Card>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500'>{t('admin.revenueRefunded')}</p>
              <p className='text-2xl font-bold text-red-600'>{formatCurrency(overview.refunded)}</p>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <ChartCard
              title={t('admin.chartRevenueTrend')}
              data={revenueTrend}
              colorScheme='primary'
              loading={loading}
            />
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                {t('admin.revenueBreakdownByType')}
              </h3>
              <div className='space-y-2'>
                {Object.entries(breakdown).map(([key, value]) => (
                  <div key={key} className='flex justify-between text-sm'>
                    <span className='text-neutral-600 capitalize'>{key.replace('_', ' ')}</span>
                    <span className='font-medium'>{formatCurrency(value)}</span>
                  </div>
                ))}
                {Object.keys(breakdown).length === 0 && (
                  <p className='text-neutral-500 text-sm'>{t('admin.revenueNoBreakdownData')}</p>
                )}
              </div>
            </Card>
          </div>

          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
              {t('admin.revenueTopEarningDoctors')}
            </h3>
            {topDoctors.length === 0 ? (
              <p className='text-neutral-500 text-sm'>{t('admin.revenueNoDataForPeriod')}</p>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th className='text-right'>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDoctors.map((d) => (
                      <tr key={d.doctorId}>
                        <td>{d.doctorName}</td>
                        <td className='text-right font-medium'>{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
