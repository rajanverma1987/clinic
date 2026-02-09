'use client';

/**
 * Dashboard tab: appointments list. Fetches own data; links to full /appointments page.
 */
import { AppointmentsListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const LIMIT = 10;

export function AppointmentsTab() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { prefetchAppointment } = usePrefetchDetail();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!user || authLoading) return;
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: String(LIMIT) });
      const response = await apiClient.get(`/appointments?${params}`);
      if (response.success && response.data) {
        const list = extractArrayData(response);
        const filtered = (list || []).filter(
          (apt) => apt && !apt.isTelemedicine && apt.status !== 'arrived',
        );
        setAppointments(filtered);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      logger.error('Failed to fetch appointments (tab)', err);
      setAppointments([]);
      setError(err?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, t]);

  useEffect(() => {
    if (!authLoading && user) fetchAppointments();
  }, [authLoading, user, fetchAppointments]);

  const getStatusLabel = (status) => {
    const map = {
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
    };
    return map[status] || status;
  };

  const columns = [
    {
      header: t('appointments.patient'),
      accessor: (row) =>
        [row.patientId?.firstName, row.patientId?.lastName].filter(Boolean).join(' ') || '—',
    },
    {
      header: t('appointments.date'),
      accessor: (row) =>
        row.appointmentDate ? new Date(row.appointmentDate).toLocaleDateString() : '—',
    },
    {
      header: t('appointments.time'),
      accessor: (row) =>
        row.startTime && row.endTime
          ? `${new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : '—',
    },
    {
      header: t('appointments.status'),
      accessor: (row) => {
        const variant =
          row.status === 'completed'
            ? 'success'
            : row.status === 'cancelled'
              ? 'danger'
              : row.status === 'in_progress' || row.status === 'arrived'
                ? 'primary'
                : 'default';
        return (
          <Tag variant={variant} size='sm'>
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
  ];

  if (authLoading || !user) {
    return (
      <Card className='p-6'>
        <Loader type='section' text={t('common.loading')} />
      </Card>
    );
  }

  if (loading) {
    return <AppointmentsListSkeleton />;
  }

  if (error) {
    return (
      <Card className='p-6'>
        <p className='text-status-error text-body-sm mb-3'>{error}</p>
        <Button variant='secondary' size='md' onClick={() => fetchAppointments()}>
          {t('common.retry')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between gap-4 mb-4'>
        <h2 className='text-lg font-semibold text-neutral-900'>{t('appointments.title')}</h2>
        <div className='flex gap-2'>
          <Link
            href='/appointments'
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium min-h-[40px] rounded-lg bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          >
            {t('dashboard.seeAll')}
          </Link>
          <Link
            href='/appointments/new'
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium min-h-[40px] rounded-lg bg-[#15803d] text-white border-2 border-white shadow-[0_0_0_1px_#15803d] hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          >
            {t('appointments.bookAppointment')}
          </Link>
        </div>
      </div>
      <Table
        data={appointments}
        columns={columns}
        onRowClick={(row) => row?._id && router.push(`/appointments/${row._id}`)}
        onRowMouseEnter={(row) => row?._id && prefetchAppointment(row._id)}
        emptyMessage={t('appointments.noAppointmentsFound')}
      />
    </Card>
  );
}
