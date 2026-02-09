'use client';

import { ChartCard } from '@/app/dashboard/components/ChartCard';
import { FileDownIcon, MailIcon, RefreshCwIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchAnalytics();
    }
  }, [authLoading, user, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await apiClient.get(`/admin/analytics?${params.toString()}`);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      logger.error('Failed to fetch analytics', err);
      showError(t('admin.failedToFetchAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${base}/api/admin/analytics/export?${params.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'text/csv' },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('admin.exportDownloadedShort'));
    } catch (err) {
      showError(t('admin.failedToExport'));
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleReport = () => {
    showSuccess(t('admin.scheduleReportComingSoon'));
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = startDate || endDate;

  if (authLoading || (loading && !data)) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const stats = data?.appointmentStats ?? {};
  const specialties = data?.popularSpecialties ?? [];
  const peakHours = data?.peakHours ?? [];

  return (
    <Layout
      title='Platform Analytics'
      subtitle='User growth, revenue trend, appointment stats, specialty distribution, peak hours'
    >
      <div className='admin-page-content'>
        {/* Filter Bar */}
        <Card className='mb-6'>
          <div className='p-5'>
            <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
              <div className='flex flex-col sm:flex-row gap-4 flex-1'>
                <div className='flex-1 sm:flex-initial'>
                  <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                    From Date
                  </label>
                  <Input
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='form-control-height w-full sm:w-[180px]'
                  />
                </div>
                <div className='flex-1 sm:flex-initial'>
                  <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
                    To Date
                  </label>
                  <Input
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className='form-control-height w-full sm:w-[180px]'
                  />
                </div>
                {hasFilters && (
                  <div className='flex items-end'>
                    <Button variant='ghost' size='sm' onClick={handleClearFilters} iconOnly>
                      <XIcon className='icon icon-xs' />
                    </Button>
                  </div>
                )}
              </div>
              <div className='flex items-center gap-1 shrink-0'>
                <Button
                  variant='secondary'
                  size='xs'
                  onClick={handleExport}
                  disabled={exporting}
                  iconOnly
                  aria-label='Export CSV'
                  title='Export CSV'
                >
                  {exporting ? (
                    <RefreshCwIcon className='icon icon-xs animate-spin' />
                  ) : (
                    <FileDownIcon className='icon icon-xs' />
                  )}
                </Button>
                <Button
                  variant='secondary'
                  size='xs'
                  onClick={handleScheduleReport}
                  iconOnly
                  aria-label='Schedule report email'
                  title='Schedule report email'
                >
                  <MailIcon className='icon icon-xs' />
                </Button>
                <Button variant='primary' size='md' onClick={fetchAnalytics}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <Card>
            <div className='p-4'>
              <p className='text-xs font-medium text-neutral-500 uppercase'>Total Appointments</p>
              <p className='text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1'>
                {stats.total ?? 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-4'>
              <p className='text-xs font-medium text-neutral-500 uppercase'>Completed</p>
              <p className='text-2xl font-bold text-green-600 dark:text-green-500 mt-1'>
                {stats.completed ?? 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-4'>
              <p className='text-xs font-medium text-neutral-500 uppercase'>Cancelled</p>
              <p className='text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1'>
                {stats.cancelled ?? 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-4'>
              <p className='text-xs font-medium text-neutral-500 uppercase'>No-show</p>
              <p className='text-2xl font-bold text-red-600 dark:text-red-500 mt-1'>
                {stats.no_show ?? 0}
              </p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          <ChartCard
            title='User Growth'
            data={data?.userGrowth ?? []}
            colorScheme='primary'
            loading={loading}
          />
          <ChartCard
            title='Revenue Trend'
            data={data?.revenueTrends ?? []}
            colorScheme='primary'
            loading={loading}
          />
        </div>

        {/* Specialties & Peak Hours */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                Popular Specialties
              </h3>
              {specialties.length === 0 ? (
                <p className='text-neutral-500 dark:text-neutral-400'>No data available</p>
              ) : (
                <ul className='space-y-2'>
                  {specialties.slice(0, 10).map((s) => (
                    <li key={s.name} className='flex justify-between text-sm'>
                      <span className='text-neutral-700 dark:text-neutral-300'>{s.name}</span>
                      <span className='font-medium text-neutral-900 dark:text-neutral-100'>
                        {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
                Peak Hours (last 90 days)
              </h3>
              {peakHours.length === 0 ? (
                <p className='text-neutral-500 dark:text-neutral-400'>No data available</p>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {peakHours
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 12)
                    .map((h) => (
                      <div
                        key={h.hour}
                        className='px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm'
                        title={`${h.count} appointments`}
                      >
                        {h.hour}:00 – {h.count}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
