'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminAppointmentAnalyticsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'super_admin') {
        router.replace('/admin');
        return;
      }
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await apiClient.get(`/admin/appointments/analytics?${params.toString()}`);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      logger.error('Failed to fetch analytics:', err);
      showError(t('admin.failedToFetchAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.appointmentAnalyticsTitle')}
      subtitle={t('admin.appointmentAnalyticsSubtitle')}
    >
      <div className='admin-page-content'>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.appointmentsFromDate')}
                </label>
                <Input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.appointmentsToDate')}
                </label>
                <Input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className='flex items-end'>
                <Button variant='primary' onClick={fetchAnalytics}>
                  {t('admin.appointmentAnalyticsApply')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        {data && (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
              <Card className='p-6'>
                <p className='text-sm text-neutral-500'>
                  {t('admin.appointmentAnalyticsTotalAppointments')}
                </p>
                <p className='text-2xl font-bold text-neutral-900'>{data.total}</p>
              </Card>
              <Card className='p-6'>
                <p className='text-sm text-neutral-500'>
                  {t('admin.appointmentAnalyticsCompletionRate')}
                </p>
                <p className='text-2xl font-bold text-green-600'>{data.completionRate}%</p>
              </Card>
              <Card className='p-6'>
                <p className='text-sm text-neutral-500'>
                  {t('admin.appointmentAnalyticsCancellationRate')}
                </p>
                <p className='text-2xl font-bold text-amber-600'>{data.cancellationRate}%</p>
              </Card>
              <Card className='p-6'>
                <p className='text-sm text-neutral-500'>
                  {t('admin.appointmentAnalyticsNoShowRate')}
                </p>
                <p className='text-2xl font-bold text-red-600'>{data.noShowRate}%</p>
              </Card>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                  {t('admin.appointmentAnalyticsAvgConsultation')}
                </h3>
                <p className='text-2xl font-bold text-neutral-900'>
                  {data.avgConsultationDurationMinutes?.toFixed(1) ?? '—'} min
                </p>
              </Card>
              <Card className='p-6'>
                <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                  {t('admin.appointmentAnalyticsPeakHours')}
                </h3>
                <ul className='space-y-2'>
                  {(data.peakHours || []).map(({ hour, count }) => (
                    <li key={hour} className='flex justify-between text-sm'>
                      <span>
                        {hour}:00 – {hour + 1}:00
                      </span>
                      <span className='font-medium'>{count} appointments</span>
                    </li>
                  ))}
                  {(!data.peakHours || data.peakHours.length === 0) && (
                    <li className='text-neutral-500'>{t('admin.appointmentAnalyticsNoData')}</li>
                  )}
                </ul>
              </Card>
            </div>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                {t('admin.appointmentAnalyticsDoctorWise')}
              </h3>
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>{t('admin.appointmentAnalyticsDoctorId')}</th>
                      <th>Total</th>
                      <th>{t('admin.appointmentAnalyticsCompleted')}</th>
                      <th>{t('admin.appointmentAnalyticsCancelled')}</th>
                      <th>Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.doctorStats || []).map((s) => (
                      <tr key={s.doctorId}>
                        <td>{s.doctorId}</td>
                        <td>{s.total}</td>
                        <td>{s.completed}</td>
                        <td>{s.cancelled}</td>
                        <td>{s.completionRate?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
