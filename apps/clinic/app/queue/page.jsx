'use client';

import {
  Building2Icon,
  CheckIcon,
  EyeIcon,
  ListChecksIcon,
  PlayIcon,
  VideoIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ROUTE_KEY = 'route_queue';

export default function QueuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const { t } = useI18n();
  const { locale } = useSettings();
  const userId = user?._id ?? user?.id ?? user?.userId ?? null;

  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [resolvedDoctorId, setResolvedDoctorId] = useState(null); // Doctor document _id for doctor role

  const isClinicAdmin = user?.role === 'clinic_admin';
  const isDoctor = user?.role === 'doctor';

  useLayoutEffect(() => {
    if (!userId) return;
    const cached = routeCache.getData(ROUTE_KEY, userId);
    if (cached && cached.queueEntries != null) {
      setQueueEntries(cached.queueEntries);
      setLoading(false);
    }
  }, [userId]);
  const isInitialMountRef = useRef(true);
  const isFetchingRef = useRef(false);
  const currentDoctorIdRef = useRef('');
  const [notifications, setNotifications] = useState(3);

  const formatDateDisplay = () => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Resolve Doctor document _id when user is a doctor (Queue stores doctorId = Doctor._id, not User._id)
  useEffect(() => {
    const validUserId = userId && userId !== 'undefined' && String(userId).trim() !== '';
    if (isDoctor && validUserId) {
      apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`).then((res) => {
        if (res.success && res.data?._id) {
          setResolvedDoctorId(res.data._id);
        }
      });
    } else {
      setResolvedDoctorId(null);
    }
  }, [isDoctor, userId]);

  useEffect(() => {
    if (isDoctor && resolvedDoctorId) {
      currentDoctorIdRef.current = resolvedDoctorId;
    } else if (isClinicAdmin) {
      currentDoctorIdRef.current = selectedDoctorId || '';
    } else {
      currentDoctorIdRef.current = '';
    }
  }, [isDoctor, isClinicAdmin, resolvedDoctorId, selectedDoctorId]);

  useEffect(() => {
    if (isClinicAdmin) {
      apiClient.get('/doctors').then((res) => {
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.doctors || res.data.data || [];
          setDoctors(list);
        }
      });
    }
  }, [isClinicAdmin]);

  // Create stable fetch function using useCallback
  const fetchQueue = useCallback(
    async (showLoading = false) => {
      if (isFetchingRef.current) return;

      const hasCache = userId && routeCache.getData(ROUTE_KEY, userId);
      isFetchingRef.current = true;
      if (showLoading && !hasCache) {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (currentDoctorIdRef.current) {
          params.append('doctorId', currentDoctorIdRef.current);
        }

        const activeResponse = await apiClient.get(`/queue?${params}`);
        let allEntries = [];
        if (activeResponse.success && activeResponse.data) {
          const activeList = extractArrayData(activeResponse);
          allEntries = [...activeList];
        }

        if (showCompleted) {
          const completedParams = new URLSearchParams();
          if (currentDoctorIdRef.current) {
            completedParams.append('doctorId', currentDoctorIdRef.current);
          }
          completedParams.append('status', 'completed');
          const completedResponse = await apiClient.get(`/queue?${completedParams}`);
          if (completedResponse.success && completedResponse.data) {
            const completedList = extractArrayData(completedResponse);
            allEntries = [...allEntries, ...completedList];
          }
        }

        setQueueEntries(allEntries);
        if (userId) routeCache.set(ROUTE_KEY, userId, { queueEntries: allEntries });
      } catch (error) {
        logger.error('Failed to fetch queue', error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    },
    [showCompleted, userId],
  );

  // Effect: Initial fetch and refetch on doctor change. For doctors, wait until resolvedDoctorId is set.
  useEffect(() => {
    if (authLoading || !user) return;
    if (isDoctor && !resolvedDoctorId) return; // Queue filter needs Doctor _id, not User id

    if (isInitialMountRef.current) {
      fetchQueue(true);
      isInitialMountRef.current = false;
    } else {
      fetchQueue(false);
    }
  }, [authLoading, user, isDoctor, resolvedDoctorId, fetchQueue]);

  // Refetch when showCompleted changes
  useEffect(() => {
    if (!authLoading && user && (!isDoctor || resolvedDoctorId)) {
      fetchQueue(false);
    }
  }, [showCompleted, authLoading, user, isDoctor, resolvedDoctorId, fetchQueue]);

  const handleStatusChange = async (queueId, newStatus) => {
    try {
      const response = await apiClient.put(`/queue/${queueId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        fetchQueue(false); // Silent update after status change
      }
    } catch (error) {
      logger.error('Failed to update queue status', error);
    }
  };

  const formatWaitTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} ${t('queue.minutes')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartVideo = async (appointment) => {
    try {
      let sessionId = appointment.telemedicineSessionId;

      // If no session exists, create one
      if (!sessionId && appointment._id) {
        const response = await apiClient.post('/telemedicine/sessions', {
          appointmentId: appointment._id,
          patientId: appointment.patientId?._id || appointment.patientId,
          doctorId: appointment.doctorId?._id || appointment.doctorId,
          scheduledStartTime: appointment.startTime || new Date(),
          scheduledEndTime: appointment.endTime || new Date(),
          sessionType: 'video',
        });

        if (response.success && response.data) {
          sessionId = response.data._id;
          // Update the appointment with the session ID
          await apiClient.put(`/appointments/${appointment._id}`, {
            telemedicineSessionId: sessionId,
          });
        } else {
          showError(response.error?.message || t('errors.failedToCreateVideoSession'));
          return;
        }
      }

      if (sessionId) {
        // Open in new tab with doctor role
        window.open(`/telemedicine/${sessionId}?role=doctor`, '_blank');
      } else {
        showError(t('errors.unableToStartVideoSession'));
      }
    } catch (error) {
      logger.error('Failed to start video', error);
      showError(error.message || t('errors.failedToStartVideoSession'));
    }
  };

  const columns = [
    { header: t('queue.queueNumber'), accessor: 'queueNumber' },
    { header: t('queue.position'), accessor: 'position' },
    ...(isClinicAdmin
      ? [
          {
            header: t('queue.doctor'),
            accessor: (row) =>
              row.doctorId
                ? `${row.doctorId.firstName || ''} ${row.doctorId.lastName || ''}`.trim() || '—'
                : '—',
          },
        ]
      : []),
    {
      header: t('appointments.patient'),
      accessor: (row) => `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    ...(!isClinicAdmin
      ? [
          {
            header: t('appointments.doctor'),
            accessor: (row) => `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
          },
        ]
      : []),
    {
      header: t('queue.type'),
      accessor: (row) => (
        <div className='flex items-center gap-2'>
          {row.appointmentId?.isTelemedicine ? (
            <Tag variant='default' className='flex items-center gap-1'>
              <VideoIcon className='icon icon-xs' />
              {t('queue.video')}
            </Tag>
          ) : (
            <Tag variant='success' className='flex items-center gap-1'>
              <Building2Icon className='icon icon-xs' />
              {t('queue.inPerson')}
            </Tag>
          )}
        </div>
      ),
    },
    {
      header: t('queue.priority'),
      accessor: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.priority === 'urgent'
              ? 'bg-status-error/10 text-status-error'
              : row.priority === 'high'
                ? 'bg-status-warning/10 text-status-warning'
                : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      header: t('queue.estimatedWait'),
      accessor: (row) => formatWaitTime(row.estimatedWaitTime),
    },
    {
      header: t('common.actions'),
      accessor: (row) => {
        if (row.status === 'completed') {
          return (
            <span className='text-sm font-medium text-neutral-500'>{t('queue.completed')}</span>
          );
        }

        const patientId = row.patientId?._id || row.patientId;
        const menuItems = [];

        // View appointment if available
        if (row.appointmentId?._id) {
          menuItems.push({
            key: 'view',
            label: t('common.view') || 'View',
            icon: <EyeIcon className='icon icon-sm' />,
            onClick: () => router.push(`/appointments/${row.appointmentId._id}`),
          });
        }

        if (row.status === 'in_progress') {
          // In progress: video call (if telemedicine), start appointment, mark complete
          if (row.appointmentId?.isTelemedicine) {
            menuItems.push({
              key: 'startVideo',
              label: t('queue.startVideo') || 'Start Video',
              icon: <VideoIcon className='icon icon-sm' />,
              onClick: async () => await handleStartVideo(row.appointmentId),
            });
            menuItems.push({
              key: 'startAppointment',
              label: t('appointments.startAppointment') || 'Start Appointment',
              icon: <PlayIcon className='icon icon-sm' />,
              onClick: () => {
                if (patientId) {
                  router.push(`/prescriptions/new?patientId=${patientId}`);
                } else {
                  router.push('/prescriptions/new');
                }
              },
            });
          }
          menuItems.push({
            key: 'markComplete',
            label: t('queue.markComplete') || 'Mark Complete',
            icon: <CheckIcon className='icon icon-sm' />,
            onClick: () => {
              openConfirm({
                title: t('queue.confirmComplete'),
                message:
                  t('queue.confirmCompleteDescription') || t('common.confirmationDescription'),
                variant: 'danger',
                onConfirm: () => handleStatusChange(row._id, 'completed'),
              });
            },
          });
        } else {
          // Waiting: start video (if telemedicine) or start appointment
          if (row.appointmentId?.isTelemedicine) {
            menuItems.push({
              key: 'startVideo',
              label: t('queue.startVideo') || 'Start Video',
              icon: <VideoIcon className='icon icon-sm' />,
              onClick: async () => await handleStartVideo(row.appointmentId),
            });
            menuItems.push({
              key: 'startAppointment',
              label: t('appointments.startAppointment') || 'Start Appointment',
              icon: <PlayIcon className='icon icon-sm' />,
              onClick: async () => {
                await handleStatusChange(row._id, 'in_progress');
                if (patientId) {
                  router.push(`/prescriptions/new?patientId=${patientId}`);
                } else {
                  router.push('/prescriptions/new');
                }
              },
            });
          } else {
            menuItems.push({
              key: 'startAppointment',
              label: t('appointments.startAppointment') || 'Start Appointment',
              icon: <PlayIcon className='icon icon-sm' />,
              onClick: async () => {
                await handleStatusChange(row._id, 'in_progress');
                if (patientId) {
                  router.push(`/prescriptions/new?patientId=${patientId}`);
                } else {
                  router.push('/prescriptions/new');
                }
              },
            });
          }
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              ariaLabel={t('common.actions') || 'Actions'}
              triggerSize='xs'
              items={menuItems}
            />
          </div>
        );
      },
    },
  ];

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <PageHeader
        title={t('queue.queueManagement')}
        subtitle={formatDateDisplay()}
        notifications={[]}
        unreadCount={0}
        onRefresh={() => fetchQueue(true)}
        refreshing={loading}
        actionButtons={[
          ...(isClinicAdmin && doctors.length > 0
            ? [
                <div key='doctor-filter' className='flex items-center gap-2'>
                  <label className='text-sm text-neutral-600'>{t('queue.selectDoctor')}</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className='px-3 py-2 border border-neutral-300 rounded-lg text-sm'
                  >
                    <option value=''>{t('queue.allDoctors')}</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                </div>,
              ]
            : []),
          <Button
            key='toggle-completed'
            variant='secondary'
            size='md'
            onClick={() => setShowCompleted(!showCompleted)}
            className='flex items-center gap-2'
          >
            <ListChecksIcon className='icon icon-sm shrink-0' ariaHidden />
            {showCompleted ? t('queue.hideCompleted') : t('queue.showCompleted')}
          </Button>,
        ]}
      />
      <div style={{ padding: '0 10px' }}>
        {loading ? (
          <Card>
            <TableSkeleton rows={10} cols={6} />
          </Card>
        ) : (
          <Card>
            <Table
            data={queueEntries.sort((a, b) => a.position - b.position)}
            columns={columns}
            emptyMessage={t('common.noDataFound')}
          />
          </Card>
        )}
      </div>
    </Layout>
  );
}
