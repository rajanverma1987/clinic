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
import { useEffect, useState } from 'react';

export default function TelemedicinePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testVideoLoading, setTestVideoLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/telemedicine/sessions');
      if (response.success && response.data) {
        setSessions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      logger.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'default',
      IN_PROGRESS: 'success',
      COMPLETED: 'default',
      CANCELLED: 'danger',
    };
    return colors[status] || 'default';
  };

  const handleJoinSession = (sessionId) => {
    router.push(`/telemedicine/${sessionId}`);
  };

  /** TEMP: Remove before production – creates a test session and opens video room */
  const handleTestVideoCall = async () => {
    setTestVideoLoading(true);
    try {
      const response = await apiClient.post('/telemedicine/sessions/test');
      if (response?.success && response?.data?.id) {
        router.push(`/telemedicine/${response.data.id}?role=doctor`);
      } else {
        logger.warn('Test video session failed', response?.error);
        alert(response?.error?.message || t('common.error'));
      }
    } catch (err) {
      logger.error('Test video session error', err);
      alert(err?.message || t('common.error'));
    } finally {
      setTestVideoLoading(false);
    }
  };

  const columns = [
    {
      header: t('telemedicine.sessionId'),
      accessor: (row) => <span className='font-mono text-sm'>{row.sessionId}</span>,
    },
    {
      header: t('telemedicine.patient'),
      accessor: (row) =>
        `${row.patientId.firstName} ${row.patientId.lastName} (${row.patientId.patientId})`,
    },
    {
      header: t('telemedicine.doctor'),
      accessor: (row) => `Dr. ${row.doctorId.firstName} ${row.doctorId.lastName}`,
    },
    {
      header: t('telemedicine.type'),
      accessor: (row) => <Tag variant='default'>{row.sessionType}</Tag>,
    },
    {
      header: t('telemedicine.scheduledTime'),
      accessor: (row) => new Date(row.scheduledStartTime).toLocaleString(),
    },
    {
      header: t('telemedicine.status'),
      accessor: (row) => <Tag variant={getStatusColor(row.status)}>{row.status}</Tag>,
    },
    {
      header: t('common.actions'),
      accessor: (row) => {
        const items = [];
        if (row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS') {
          items.push({
            key: 'join',
            label: t('telemedicine.joinSession'),
            onClick: () => handleJoinSession(row._id),
          });
        } else {
          items.push({
            key: 'summary',
            label: t('telemedicine.viewSummary'),
            onClick: () => router.push(`/telemedicine/${row._id}/summary`),
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
  ];

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
        actionButton={
          <Button href='/appointments/new' variant='primary' size='md'>
            {t('telemedicine.bookAppointment')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {/* TEMP: Test video consulting – remove before production (and delete app/api/telemedicine/sessions/test/route.js) */}
        <div className='mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20'>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            onClick={handleTestVideoCall}
            disabled={testVideoLoading}
          >
            {testVideoLoading ? t('common.loading') : t('telemedicine.testVideoCall')}
          </Button>
          <span className='text-xs text-amber-700 dark:text-amber-300'>
            ({t('telemedicine.testVideoCallHint')})
          </span>
        </div>

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
                Get Started with Telemedicine
              </h3>
              <p className='text-neutral-600 mb-6 max-w-md mx-auto'>
                Schedule video consultations from the appointments page. Select &quot;Video
                Consultation&quot; when booking to enable remote care with secure, HIPAA-compliant
                video calls.
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
