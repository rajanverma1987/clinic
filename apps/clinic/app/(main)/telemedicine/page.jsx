'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function TelemedicinePage() {
  const router = useRouter();
  const { t, locale: i18nLocale } = useI18n();
  const { user } = useAuth();
  const localeCode = (i18nLocale || 'en').slice(0, 2);
  const dateLocale =
    localeCode === 'ar' ? 'ar' : localeCode === 'es' ? 'es' : (i18nLocale || 'en-US');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOpenSearch = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSearch'));
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (localeCode) params.set('locale', localeCode);
      const response = await apiClient.get(
        `/telemedicine/sessions${params.toString() ? `?${params}` : ''}`,
      );
      if (response.success && response.data) {
        setSessions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      logger.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [localeCode]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'default',
      IN_PROGRESS: 'success',
      COMPLETED: 'default',
      CANCELLED: 'danger',
    };
    return colors[status] || 'default';
  };

  const getSessionTypeKey = (sessionType) => {
    const normalized = (sessionType || '').toUpperCase();
    if (normalized === 'CHAT') return 'typeChat';
    return 'typeVideo'; // VIDEO, video_consultation, or unknown
  };

  const getStatusKey = (status) => {
    const map = {
      SCHEDULED: 'statusScheduled',
      IN_PROGRESS: 'statusInProgress',
      COMPLETED: 'statusCompleted',
      CANCELLED: 'statusCancelled',
    };
    return map[status] || 'statusScheduled';
  };

  const handleJoinSession = (sessionId) => {
    router.push(`/telemedicine/${sessionId}`);
  };

  const columns = useMemo(
    () => [
      {
        header: () => t('telemedicine.sessionId'),
        accessor: (row) => <span className='font-mono text-sm'>{row.sessionId}</span>,
      },
      {
        header: () => t('telemedicine.patient'),
        accessor: (row) => {
          const name =
            row.patientDisplayName ||
            (row.patientId
              ? `${row.patientId.firstName || ''} ${row.patientId.lastName || ''}`.trim()
              : '');
          const pid = row.patientId?.patientId ? ` (${row.patientId.patientId})` : '';
          return name ? `${name}${pid}` : t('common.na');
        },
      },
      {
        header: () => t('telemedicine.doctor'),
        accessor: (row) => {
          const name =
            row.doctorDisplayName ||
            (row.doctorId
              ? `${row.doctorId.firstName || ''} ${row.doctorId.lastName || ''}`.trim()
              : '');
          return name ? `${t('telemedicine.doctorPrefix')} ${name}` : t('common.na');
        },
      },
      {
        header: () => t('telemedicine.type'),
        accessor: (row) => (
          <Tag variant='default'>{t(`telemedicine.${getSessionTypeKey(row.sessionType)}`)}</Tag>
        ),
      },
      {
        header: () => t('telemedicine.scheduledTime'),
        accessor: (row) =>
          row.scheduledStartTime
            ? new Date(row.scheduledStartTime).toLocaleString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : t('common.na'),
      },
      {
        header: () => t('telemedicine.status'),
        accessor: (row) => (
          <Tag variant={getStatusColor(row.status)}>
            {t(`telemedicine.${getStatusKey(row.status)}`)}
          </Tag>
        ),
      },
      {
        header: () => t('common.actions'),
        accessor: (row) => {
          const items = [];
          if (row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS') {
            items.push({
              key: 'join',
              label: t('telemedicine.joinSession'),
              onClick: () => handleJoinSession(row._id ?? row.sessionId),
            });
          } else {
            items.push({
              key: 'summary',
              label: t('telemedicine.viewSummary'),
              onClick: () => router.push(`/telemedicine/${row._id ?? row.sessionId}/summary`),
            });
          }
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                ariaLabel={t('common.actions')}
                triggerSize='xs'
                items={items}
              />
            </div>
          );
        },
      },
    ],
    [t, dateLocale, localeCode, getStatusKey, getSessionTypeKey, getStatusColor, handleJoinSession, router],
  );

  if (loading) {
    return (
      <Layout
        title={t('telemedicine.title')}
        subtitle={t('telemedicine.subtitle')}
        loading
        loadingText={t('common.loading')}
      />
    );
  }

  return (
    <Layout>
      <PageHeader
        title={t('telemedicine.title')}
        subtitle={t('telemedicine.subtitle')}
        notifications={[]}
        unreadCount={0}
        onOpenSearch={handleOpenSearch}
        actionButton={
          <Button href='/appointments/new' variant='primary' size='md'>
            {t('telemedicine.bookAppointment')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>{t('telemedicine.todaySessions')}</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {
                      sessions.filter(
                        (s) =>
                          new Date(s.scheduledStartTime).toDateString() ===
                          new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='icon icon-md text-primary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>{t('telemedicine.inProgress')}</p>
                  <p className='text-2xl font-bold text-secondary-600 mt-1'>
                    {sessions.filter((s) => s.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                  <div className='w-3 h-3 bg-secondary-500 rounded-full'></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>{t('telemedicine.scheduled')}</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {sessions.filter((s) => s.status === 'SCHEDULED').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='icon icon-md text-primary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>{t('telemedicine.completed')}</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {sessions.filter((s) => s.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-neutral-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions List */}
        <Card>
          <div className='p-4 border-b border-neutral-200'>
            <h2 className='text-lg font-semibold'>{t('telemedicine.allSessions')}</h2>
          </div>

          <Table
            key={localeCode}
            data={sessions}
            columns={columns}
            emptyMessage={t('telemedicine.noSessionsFound')}
          />
        </Card>

        {/* Setup Notice if no sessions */}
        {sessions.length === 0 && !loading && (
          <Card className='mt-6'>
            <div className='p-8 text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-primary-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                {t('telemedicine.getStartedTitle')}
              </h3>
              <p className='text-neutral-600 mb-6 max-w-md mx-auto'>
                {t('telemedicine.getStartedDescription')}
              </p>
              <div className='flex gap-4 justify-center'>
                <Button href='/appointments/new'>{t('telemedicine.bookVideoConsultation')}</Button>
                <Button variant='secondary' size='md' href='/appointments'>
                  {t('telemedicine.viewAppointments')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
