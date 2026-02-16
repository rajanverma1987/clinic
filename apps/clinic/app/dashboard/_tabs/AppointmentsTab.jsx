'use client';

/**
 * Dashboard tab: appointments list.
 * Enterprise stale-while-revalidate: show cached/preloaded data immediately, revalidate after 5s.
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
import {
  fetchAppointmentsTab,
  getCachedAppointments,
  REVALIDATE_DELAY_MS,
} from '@/lib/dashboard-tab-cache';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const LIMIT = 10;

export function AppointmentsTab({ isActive = false }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { prefetchAppointment } = usePrefetchDetail();
  const userId = user?._id || user?.userId;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const revalidateTimerRef = useRef(null);

  const fetchAndUpdate = useCallback(
    async (showRevalidating = false) => {
      if (!userId) return;
      if (showRevalidating) setIsRevalidating(true);
      const { data, error: err } = await fetchAppointmentsTab(userId);
      if (err) {
        if (!showRevalidating) setError(err?.message || t('common.error'));
        setAppointments((prev) => (prev.length ? prev : []));
      } else {
        setAppointments(data || []);
        setError(null);
      }
      setLoading(false);
      setIsRevalidating(false);
    },
    [userId, t],
  );

  // When tab becomes active: show cached immediately, revalidate after delay. Cache is always updated on fetch.
  useEffect(() => {
    if (authLoading || !user || !userId) return;
    if (!isActive) return;

    const cached = getCachedAppointments(userId);
    if (cached !== null && Array.isArray(cached)) {
      setAppointments(cached);
      setLoading(false);
      setError(null);
    } else {
      fetchAndUpdate(false);
    }

    revalidateTimerRef.current = setTimeout(() => fetchAndUpdate(true), REVALIDATE_DELAY_MS);
    return () => {
      if (revalidateTimerRef.current) clearTimeout(revalidateTimerRef.current);
    };
  }, [isActive, userId, authLoading, user, fetchAndUpdate]);

  const getStatusLabel = useCallback(
    (status) => {
      const map = {
        scheduled: t('appointments.scheduled'),
        confirmed: t('appointments.confirmed'),
        completed: t('appointments.completed'),
        cancelled: t('appointments.cancelled'),
        arrived: t('appointments.arrived'),
        in_progress: t('appointments.inProgress'),
      };
      return map[status] || status;
    },
    [t],
  );

  const columns = useMemo(
    () => [
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
    ],
    [t, getStatusLabel],
  );

  const stats = useMemo(
    () => ({
      total: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
        .length,
      inProgress: appointments.filter((a) => a.status === 'in_progress' || a.status === 'arrived')
        .length,
      completed: appointments.filter((a) => a.status === 'completed').length,
    }),
    [appointments],
  );

  const cardContent = (
    <>
      <div className='section-header flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>{t('appointments.title')}</h2>
          {isRevalidating && (
            <span className='text-xs text-neutral-500' aria-hidden>
              {t('common.updating') || 'Updating…'}
            </span>
          )}
        </div>
        <div className='flex gap-2 ml-auto'>
          <Button
            variant='secondary'
            size='sm'
            href='/appointments'
            className='section-header-action'
          >
            {t('dashboard.seeAll')}
          </Button>
          <Button
            variant='primary'
            size='sm'
            href='/appointments/new'
            className='section-header-action'
          >
            {t('appointments.bookAppointment')}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.total}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>
            {t('common.total')}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.scheduled}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>
            {t('appointments.scheduled')}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-secondary-600'>{stats.inProgress}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>
            {t('appointments.inProgress')}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-neutral-600'>{stats.completed}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>
            {t('appointments.completed')}
          </div>
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

  if (loading && appointments.length === 0) {
    return (
      <div className='dashboard-section'>
        <AppointmentsListSkeleton />
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className='dashboard-section'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center items-center'>
          <div className='empty-state-icon'>
            <svg className='icon icon-lg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <p className='text-status-error text-body-md font-medium mb-4'>{error}</p>
          <Button variant='primary' size='md' onClick={() => fetchAndUpdate(false)}>
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
