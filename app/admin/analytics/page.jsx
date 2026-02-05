'use client';

import { ChartCard } from '@/app/dashboard/components/ChartCard';
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

  if (authLoading || (loading && !data)) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const stats = data?.appointmentStats ?? {};
  const specialties = data?.popularSpecialties ?? [];
  const peakHours = data?.peakHours ?? [];

  return (
    <Layout
      title='Platform Analytics'
      subtitle='User growth, revenue trend, appointment stats, specialty distribution, peak hours'
      actionButton={
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
          <Button variant='primary' onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant='secondary' onClick={handleScheduleReport}>
            Schedule report email
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>From date</label>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>To date</label>
                <Input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className='flex items-end'>
                <Button variant='primary' onClick={fetchAnalytics}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <Card className='p-6'>
            <p className='text-sm text-neutral-500'>Appointments (period)</p>
            <p className='text-2xl font-bold text-neutral-900'>{stats.total ?? 0}</p>
          </Card>
          <Card className='p-6'>
            <p className='text-sm text-neutral-500'>Completed</p>
            <p className='text-2xl font-bold text-green-600'>{stats.completed ?? 0}</p>
          </Card>
          <Card className='p-6'>
            <p className='text-sm text-neutral-500'>Cancelled</p>
            <p className='text-2xl font-bold text-amber-600'>{stats.cancelled ?? 0}</p>
          </Card>
          <Card className='p-6'>
            <p className='text-sm text-neutral-500'>No-show</p>
            <p className='text-2xl font-bold text-red-600'>{stats.no_show ?? 0}</p>
          </Card>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          <ChartCard
            title='User growth'
            data={data?.userGrowth ?? []}
            colorScheme='primary'
            loading={loading}
          />
          <ChartCard
            title='Revenue trend'
            data={data?.revenueTrends ?? []}
            colorScheme='primary'
            loading={loading}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-4'>Popular specialties</h3>
            <ul className='space-y-2'>
              {specialties.slice(0, 10).map((s) => (
                <li key={s.name} className='flex justify-between text-sm'>
                  <span className='text-neutral-700'>{s.name}</span>
                  <span className='font-medium'>{s.count}</span>
                </li>
              ))}
              {specialties.length === 0 && <li className='text-neutral-500'>No data</li>}
            </ul>
          </Card>
          <Card className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
              Peak hours (last 90 days)
            </h3>
            <div className='flex flex-wrap gap-2'>
              {peakHours
                .sort((a, b) => b.count - a.count)
                .slice(0, 12)
                .map((h) => (
                  <div
                    key={h.hour}
                    className='px-3 py-2 rounded-lg bg-neutral-100 text-neutral-800 text-sm'
                    title={`${h.count} appointments`}
                  >
                    {h.hour}:00 – {h.count}
                  </div>
                ))}
            </div>
            {peakHours.length === 0 && <p className='text-neutral-500 text-sm'>No data</p>}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
