'use client';

import { CalendarIcon, CheckIcon, PlayIcon, UserIcon, VideoIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useInvalidateDashboard } from '@/hooks/useInvalidateDashboard';
import { apiClient } from '@/lib/api/client';
import { appointmentKey, DASHBOARD_LISTS_KEY } from '@/lib/swr/dashboard-keys';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AppointmentDetailsPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const { invalidateLists, invalidateStats } = useInvalidateDashboard();
  const { mutate } = useSWRConfig();
  const isDoctor = user?.role === 'doctor';
  const appointmentKeyVal = params?.id ? appointmentKey(params.id) : null;
  const fetcher = () =>
    apiClient.get(`/appointments/${params.id}`).then((r) => {
      if (r.success && r.data) return r.data;
      const err = new Error(r.error?.message || 'Not found');
      err.info = r.error;
      throw err;
    });
  const {
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    mutate: mutateAppointment,
  } = useSWR(appointmentKeyVal, () => fetcher(params.id), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const appointment = swrData ?? null;
  const loading = swrLoading;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConsultationNotes, setShowConsultationNotes] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const statusFromUrlApplied = useRef(false);
  const dashboardListsRollbackRef = useRef(null);

  useEffect(() => {
    if (swrError) {
      const message =
        swrError?.message?.includes('not found') || swrError?.info?.message?.includes('not found')
          ? t('appointments.notFound')
          : t('appointments.loadFailed');
      setError(message);
      showError(message);
    }
  }, [swrError, t]);

  useEffect(() => {
    if (appointment?.clinicalNote) {
      setConsultationNotes(appointment.clinicalNote.notes || '');
      setDiagnosis(appointment.clinicalNote.diagnosis || '');
    }
  }, [appointment?.clinicalNote]);

  // Apply status from URL (e.g. from /appointments/[id]/edit?status=confirmed redirect)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (
      !appointment ||
      loading ||
      statusFromUrlApplied.current ||
      !statusParam ||
      !['confirmed', 'cancelled'].includes(statusParam)
    ) {
      return;
    }
    statusFromUrlApplied.current = true;
    const applyStatus = async () => {
      try {
        setSaving(true);
        mutate(
          DASHBOARD_LISTS_KEY,
          (current) => {
            dashboardListsRollbackRef.current = current;
            if (!current || !Array.isArray(current.todayAppointments)) return current;
            return {
              ...current,
              todayAppointments: current.todayAppointments.map((apt) =>
                apt._id === params.id ? { ...apt, status: statusParam } : apt,
              ),
            };
          },
          { revalidate: false },
        );
        const response = await apiClient.put(`/appointments/${params.id}/status`, {
          status: statusParam,
        });
        if (response.success) {
          mutateAppointment((prev) => (prev ? { ...prev, status: statusParam } : prev), {
            revalidate: false,
          });
          showSuccess(t('appointments.statusUpdated') || 'Appointment status updated');
          invalidateLists();
          invalidateStats();
          router.replace(`/appointments/${params.id}`);
        } else {
          if (dashboardListsRollbackRef.current != null) {
            mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
          }
          showError(
            response.error?.message ||
              t('appointments.statusUpdateFailed') ||
              'Failed to update status',
          );
        }
      } catch (err) {
        if (dashboardListsRollbackRef.current != null) {
          mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
        }
        showError(t('appointments.statusUpdateFailed') || 'Failed to update appointment status');
      } finally {
        setSaving(false);
      }
    };
    applyStatus();
  }, [
    appointment,
    loading,
    params.id,
    searchParams,
    router,
    t,
    invalidateLists,
    invalidateStats,
    mutate,
  ]);

  const patientFullName = useMemo(
    () =>
      appointment
        ? `${appointment.patientId?.firstName || ''} ${
            appointment.patientId?.lastName || ''
          }`.trim()
        : '',
    [appointment],
  );

  const doctorFullName = useMemo(
    () =>
      appointment
        ? `${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.trim()
        : '',
    [appointment],
  );

  const handleStatusChange = async (status) => {
    try {
      setSaving(true);
      mutate(
        DASHBOARD_LISTS_KEY,
        (current) => {
          dashboardListsRollbackRef.current = current;
          if (!current || !Array.isArray(current.todayAppointments)) return current;
          return {
            ...current,
            todayAppointments: current.todayAppointments.map((apt) =>
              apt._id === params.id ? { ...apt, status } : apt,
            ),
          };
        },
        { revalidate: false },
      );
      const response = await apiClient.put(`/appointments/${params.id}/status`, { status });
      if (response.success) {
        showSuccess(t('appointments.statusUpdated'));
        mutateAppointment({ ...appointment, status }, { revalidate: false });
        setShowStatusModal(false);
        invalidateLists();
        invalidateStats();
      } else {
        if (dashboardListsRollbackRef.current != null) {
          mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
        }
        showError(response.error?.message || t('errors.failedToUpdateAppointmentStatus'));
      }
    } catch (err) {
      if (dashboardListsRollbackRef.current != null) {
        mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
      }
      showError(t('errors.failedToUpdateAppointmentStatus'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsultationNotes = async () => {
    try {
      setSaving(true);
      const response = await apiClient.post(`/clinical-notes`, {
        appointmentId: params.id,
        patientId: appointment.patientId?._id || appointment.patientId,
        notes: consultationNotes,
        diagnosis: diagnosis,
      });
      if (response.success) {
        showSuccess(t('appointments.consultationNotesSaved'));
        setShowConsultationNotes(false);
        invalidateLists();
        mutateAppointment();
      } else {
        showError(response.error?.message || t('appointments.failedToSaveConsultationNotes'));
      }
    } catch (err) {
      showError(t('appointments.failedToSaveConsultationNotes'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader type='page' text={t('auth.loadingAppointmentDetails')} />;
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className='max-w-3xl mx-auto'>
          <Card>
            <div className='text-center py-12'>
              <p className='text-lg font-semibold text-neutral-900 mb-2'>
                {t('appointments.unavailable')}
              </p>
              <p className='text-neutral-600 mb-6'>{error || t('appointments.notFoundMessage')}</p>
              <Button variant='secondary' size='md' href='/appointments'>
                {t('appointments.backToAppointments')}
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title='Appointment Details'
        subtitle={`Appointment ID: ${appointment._id}`}
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            {isDoctor && (
              <select
                className='px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm'
                value={appointment.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
              >
                <option value='scheduled'>Scheduled</option>
                <option value='confirmed'>Confirmed</option>
                <option value='arrived'>Arrived</option>
                <option value='in_progress'>In Progress</option>
                <option value='completed'>Completed</option>
                <option value='cancelled'>Cancelled</option>
                <option value='no_show'>No Show</option>
              </select>
            )}
            <Tag
              size='lg'
              variant={
                appointment.status === 'completed'
                  ? 'success'
                  : appointment.status === 'cancelled'
                    ? 'danger'
                    : 'default'
              }
            >
              {appointment.status.replace(/_/g, ' ')}
            </Tag>
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {/* Quick Actions for Doctors */}
        {isDoctor && (
          <Card className='mb-6 p-4'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-4'>Quick Actions</h3>
            <div className='flex flex-wrap gap-3'>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <Button
                    variant='primary'
                    onClick={() => {
                      handleStatusChange('in_progress');
                      router.push(`/appointments/${params.id}?startConsultation=true`);
                    }}
                  >
                    <PlayIcon className='icon icon-sm' />
                    Start Consultation
                  </Button>
                  {appointment.isTelemedicine && (
                    <Button
                      variant='primary'
                      onClick={() =>
                        router.push(
                          `/telemedicine/${appointment.telemedicineSessionId || appointment._id}`,
                        )
                      }
                    >
                      <VideoIcon className='icon icon-sm' />
                      Join Video Call
                    </Button>
                  )}
                </>
              )}
              <Button
                variant='secondary'
                onClick={() =>
                  router.push(`/patients/${appointment.patientId?._id || appointment.patientId}`)
                }
              >
                <UserIcon className='icon icon-sm' />
                View Patient History
              </Button>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <Button
                    variant='secondary'
                    onClick={() => router.push(`/appointments/${params.id}/edit`)}
                  >
                    <CalendarIcon className='icon icon-sm' />
                    Reschedule
                  </Button>
                  <Button
                    variant='danger'
                    onClick={() => {
                      openConfirm({
                        title: t('common.areYouSure'),
                        message:
                          t('appointments.confirmCancel') ||
                          'Are you sure you want to cancel this appointment?',
                        variant: 'danger',
                        onConfirm: () => handleStatusChange('cancelled'),
                      });
                    }}
                  >
                    <XIcon className='icon icon-sm' />
                    Cancel
                  </Button>
                </>
              )}
              {appointment.status === 'in_progress' && (
                <Button
                  variant='primary'
                  onClick={() => {
                    openConfirm({
                      title: t('common.areYouSure'),
                      message:
                        t('appointments.confirmMarkCompleted') ||
                        'Mark this appointment as completed?',
                      variant: 'info',
                      onConfirm: () => handleStatusChange('completed'),
                    });
                  }}
                >
                  <CheckIcon className='icon icon-sm' />
                  Mark as Completed
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className='content-grid-2 content-grid-gap-6 mb-6'>
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-neutral-900'>Patient Information</h2>
              <Tag variant='default' size='sm'>
                {appointment.patientId?.patientId || 'Unknown ID'}
              </Tag>
            </div>
            <div className='space-y-3 text-sm text-neutral-700'>
              <p>
                <span className='font-medium text-neutral-900'>Name:</span> {patientFullName || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>Phone:</span>{' '}
                {appointment.patientId?.phone || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>Email:</span>{' '}
                {appointment.patientId?.email || '—'}
              </p>
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-neutral-900'>Doctor Information</h2>
            </div>
            <div className='space-y-3 text-sm text-neutral-700'>
              <p>
                <span className='font-medium text-neutral-900'>Doctor:</span>{' '}
                {doctorFullName || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>Email:</span>{' '}
                {appointment.doctorId?.email || '—'}
              </p>
            </div>
          </Card>
        </div>

        <div className='content-grid-3 content-grid-gap-6 mb-6'>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              Date
            </h3>
            <p className='text-2xl font-bold text-neutral-900'>
              {formatDate(appointment.appointmentDate)}
            </p>
          </Card>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              Time
            </h3>
            <p className='text-xl font-semibold text-neutral-900'>
              {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
            </p>
          </Card>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              Duration
            </h3>
            <p className='text-2xl font-bold text-neutral-900'>{appointment.duration || 30} mins</p>
          </Card>
        </div>

        <div className='content-grid-2 content-grid-gap-6 mb-6'>
          <Card>
            <h3 className='text-lg font-semibold text-neutral-900 mb-3'>Reason</h3>
            <p className='text-neutral-700'>{appointment.reason || 'Not provided'}</p>
          </Card>

          <Card>
            <h3 className='text-lg font-semibold text-neutral-900 mb-3'>Notes</h3>
            <p className='text-neutral-700 whitespace-pre-wrap'>
              {appointment.notes || 'No additional notes'}
            </p>
          </Card>
        </div>

        {/* Consultation Notes for Doctors */}
        {isDoctor && (
          <Card className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-neutral-900'>Consultation Notes</h3>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setShowConsultationNotes(!showConsultationNotes)}
              >
                {showConsultationNotes ? 'Hide' : 'Add/Edit Notes'}
              </Button>
            </div>
            {showConsultationNotes ? (
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Diagnosis
                  </label>
                  <Input
                    type='text'
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder='Enter diagnosis...'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Clinical Notes
                  </label>
                  <textarea
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    rows={6}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder='Enter consultation notes, observations, treatment plan...'
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowConsultationNotes(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    size='md'
                    onClick={handleSaveConsultationNotes}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='text-neutral-600'>
                {consultationNotes ? (
                  <div>
                    {diagnosis && (
                      <p className='mb-2'>
                        <span className='font-semibold'>Diagnosis:</span> {diagnosis}
                      </p>
                    )}
                    <p className='whitespace-pre-wrap'>{consultationNotes}</p>
                  </div>
                ) : (
                  <p className='text-neutral-500 italic'>No consultation notes yet</p>
                )}
              </div>
            )}
          </Card>
        )}

        {appointment.isTelemedicine && (
          <Card className='border-primary-200 bg-primary-100'>
            <div className='flex items-start gap-4'>
              <div className='p-3 bg-primary-100 rounded-full'>
                <VideoIcon className='icon icon-md text-primary-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-neutral-900'>Telemedicine Session</h3>
                <p className='text-neutral-700 mt-2'>
                  Session ID:{' '}
                  <span className='font-mono text-sm'>
                    {appointment.telemedicineSessionId || 'Pending'}
                  </span>
                </p>
                <p className='text-neutral-700 mt-1'>
                  Consent: {appointment.telemedicineConsent ? 'Captured' : 'Not captured'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
