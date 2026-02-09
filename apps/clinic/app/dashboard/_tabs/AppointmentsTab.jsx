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

  // Calculate quick stats
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    inProgress: appointments.filter(a => a.status === 'in_progress' || a.status === 'arrived').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  const cardContent = (
    <>
      <div className='section-header flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>{t('appointments.title')}</h2>
        </div>
        <div className='flex gap-2 ml-auto'>
          <Button variant='secondary' size='sm' href='/appointments'>
            {t('dashboard.seeAll')}
          </Button>
          <Button variant='primary' size='sm' href='/appointments/new'>
            {t('appointments.bookAppointment')}
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.total}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('common.total')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.scheduled}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('appointments.scheduled')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-secondary-600'>{stats.inProgress}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('appointments.inProgress')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-neutral-600'>{stats.completed}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('appointments.completed')}</div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <Table
          data={appointments}
          columns={columns}
          onRowClick={(row) => row?._id && router.push(`/appointments/${row._id}`)}
          onRowMouseEnter={(row) => row?._id && prefetchAppointment(row._id)}
          emptyMessage={t('appointments.noAppointmentsFound')}
        />
      </div>
    </>
  );

  if (authLoading || !user) {
    return (
      <div className='dashboard-section'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
          <Loader type='section' text={t('common.loading')} />
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='dashboard-section'>
        <AppointmentsListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className='dashboard-section'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center items-center'>
          <div className='empty-state-icon'>
            <svg className='icon icon-lg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-status-error text-body-md font-medium mb-4'>{error}</p>
          <Button variant='primary' size='md' onClick={() => fetchAppointments()}>
            {t('common.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='dashboard-section'>
      <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
        {cardContent}
      </Card>
    </div>
  );
}
