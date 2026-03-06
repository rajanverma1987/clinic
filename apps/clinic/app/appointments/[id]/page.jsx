'use client';

import { CalendarIcon, CheckIcon, PlayIcon, UserIcon, VideoIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AiAssistSuggest } from '@/components/ui/AiAssistSuggest';
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
import { getDiagnosisDisplayValue } from '@/lib/i18n/inventory-name-dictionary';
import { getEmailDisplayValue } from '@/lib/utils/email-display';
import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';
import { appointmentKey, DASHBOARD_LISTS_KEY } from '@/lib/swr/dashboard-keys';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

const formatDate = (value) => {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const formatTime = (value) => {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params?.id ?? null;
  const { t, locale } = useI18n();
  const localeCode = (locale || 'en').toString().slice(0, 2);
  const getDisplayValue = (str, code) => {
    if (str == null || String(str).trim() === '') return '';
    const s = String(str).trim();
    if (code === 'ar') return transliterateToArabic(s) || s;
    if (code === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
    return s;
  };
  const { user } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const { invalidateLists, invalidateStats } = useInvalidateDashboard();
  const { mutate } = useSWRConfig();
  const isDoctor = user?.role === 'doctor';
  const appointmentKeyVal = id ? appointmentKey(id) : null;
  const fetcher = (appointmentId) =>
    apiClient.get(`/appointments/${appointmentId}`).then((r) => {
      if (r.success && r.data) return r.data;
      const err = new Error(r.error?.message || t('appointments.notFound'));
      err.info = r.error;
      throw err;
    });
  const {
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    mutate: mutateAppointment,
  } = useSWR(appointmentKeyVal, () => (id ? fetcher(id) : Promise.resolve(null)), {
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
                apt._id === id ? { ...apt, status: statusParam } : apt,
              ),
            };
          },
          { revalidate: false },
        );
        const response = await apiClient.put(`/appointments/${id}/status`, {
          status: statusParam,
        });
        if (response.success) {
          mutateAppointment((prev) => (prev ? { ...prev, status: statusParam } : prev), {
            revalidate: false,
          });
          showSuccess(t('appointments.statusUpdated'));
          invalidateLists();
          invalidateStats();
          router.replace(`/appointments/${id}`);
        } else {
          if (dashboardListsRollbackRef.current != null) {
            mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
          }
          showError(
            response.error?.message ||
              t('appointments.statusUpdateFailed'),
          );
        }
      } catch (err) {
        if (dashboardListsRollbackRef.current != null) {
          mutate(DASHBOARD_LISTS_KEY, dashboardListsRollbackRef.current, { revalidate: false });
        }
        showError(t('appointments.statusUpdateFailed'));
      } finally {
        setSaving(false);
      }
    };
    applyStatus();
  }, [
    appointment,
    loading,
    id,
    searchParams,
    router,
    t,
    invalidateLists,
    invalidateStats,
    mutate,
    mutateAppointment,
  ]);

  const patientFullName = useMemo(() => {
    if (!appointment?.patientId) return '';
    const p = appointment.patientId;
    const first =
      localeCode === 'ar' && (p.firstName_ar ?? '') !== ''
        ? p.firstName_ar
        : localeCode === 'es' && (p.firstName_es ?? '') !== ''
          ? p.firstName_es
          : getDisplayValue(p.firstName || '', localeCode);
    const last =
      localeCode === 'ar' && (p.lastName_ar ?? '') !== ''
        ? p.lastName_ar
        : localeCode === 'es' && (p.lastName_es ?? '') !== ''
          ? p.lastName_es
          : getDisplayValue(p.lastName || '', localeCode);
    return [first, last].filter(Boolean).join(' ').trim() || '';
  }, [appointment?.patientId, localeCode]);

  const doctorFullName = useMemo(() => {
    if (!appointment?.doctorId) return '';
    const d = appointment.doctorId;
    const first =
      localeCode === 'ar' && (d.firstName_ar ?? '') !== ''
        ? d.firstName_ar
        : localeCode === 'es' && (d.firstName_es ?? '') !== ''
          ? d.firstName_es
          : getDisplayValue(d.firstName || '', localeCode);
    const last =
      localeCode === 'ar' && (d.lastName_ar ?? '') !== ''
        ? d.lastName_ar
        : localeCode === 'es' && (d.lastName_es ?? '') !== ''
          ? d.lastName_es
          : getDisplayValue(d.lastName || '', localeCode);
    return [first, last].filter(Boolean).join(' ').trim() || '';
  }, [appointment?.doctorId, localeCode]);

  const statusLabelMap = useMemo(
    () => ({
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      no_show: t('appointments.noShow'),
    }),
    [t],
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
              apt._id === id ? { ...apt, status } : apt,
            ),
          };
        },
        { revalidate: false },
      );
      const response = await apiClient.put(`/appointments/${id}/status`, { status });
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
        appointmentId: id,
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
    return <Layout loading />;
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
              <p className='text-neutral-600'>{error || t('appointments.notFoundMessage')}</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={t('appointments.appointmentDetails')}
        subtitle={`${t('appointments.appointmentIdLabel')}: ${appointment._id}`}
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            {isDoctor && (
              <select
                className='px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm'
                value={appointment.status ?? ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
              >
                <option value='scheduled'>{t('appointments.scheduled')}</option>
                <option value='confirmed'>{t('appointments.confirmed')}</option>
                <option value='arrived'>{t('appointments.arrived')}</option>
                <option value='in_progress'>{t('appointments.inProgress')}</option>
                <option value='completed'>{t('appointments.completed')}</option>
                <option value='cancelled'>{t('appointments.cancelled')}</option>
                <option value='no_show'>{t('appointments.noShow')}</option>
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
              {statusLabelMap[appointment.status] ?? appointment.status?.replace(/_/g, ' ')}
            </Tag>
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {/* Quick Actions for Doctors */}
        {isDoctor && (
          <Card className='mb-6 p-4'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
              {t('appointments.quickActions')}
            </h3>
            <div className='flex flex-wrap gap-3'>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <Button
                    variant='primary'
                    onClick={() => {
                      handleStatusChange('in_progress');
                      router.push(`/appointments/${id}?startConsultation=true`);
                    }}
                  >
                    <PlayIcon className='icon icon-sm' />
                    {t('appointments.startConsultation')}
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
                      {t('appointments.joinVideoCall')}
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
                {t('appointments.viewPatientHistory')}
              </Button>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  <Button
                    variant='secondary'
                    onClick={() => router.push(`/appointments/${id}/edit`)}
                  >
                    <CalendarIcon className='icon icon-sm' />
                    {t('appointments.reschedule')}
                  </Button>
                  <Button
                    variant='danger'
                    onClick={() => {
                      openConfirm({
                        title: t('common.areYouSure'),
                        message:
                          t('appointments.confirmCancel'),
                        variant: 'danger',
                        onConfirm: () => handleStatusChange('cancelled'),
                      });
                    }}
                  >
                    <XIcon className='icon icon-sm' />
                    {t('common.cancel')}
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
                        t('appointments.confirmMarkCompleted'),
                      variant: 'info',
                      onConfirm: () => handleStatusChange('completed'),
                    });
                  }}
                >
                  <CheckIcon className='icon icon-sm' />
                  {t('appointments.markAsCompleted')}
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className='content-grid-2 content-grid-gap-6 mb-6'>
          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-neutral-900'>
                {t('appointments.patientInformation')}
              </h2>
              <Tag variant='default' size='sm'>
                {appointment.patientId?.patientId || t('appointments.unknownId')}
              </Tag>
            </div>
            <div className='space-y-3 text-sm text-neutral-700'>
              <p>
                <span className='font-medium text-neutral-900'>{t('common.name')}:</span>{' '}
                {patientFullName || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>{t('common.phone')}:</span>{' '}
                {appointment.patientId?.phone || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>{t('common.email')}:</span>{' '}
                {appointment.patientId?.email ? getEmailDisplayValue(appointment.patientId.email, localeCode) : '—'}
              </p>
            </div>
          </Card>

          <Card>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-neutral-900'>
                {t('appointments.doctorInformation')}
              </h2>
            </div>
            <div className='space-y-3 text-sm text-neutral-700'>
              <p>
                <span className='font-medium text-neutral-900'>{t('appointments.doctor')}:</span>{' '}
                {doctorFullName || '—'}
              </p>
              <p>
                <span className='font-medium text-neutral-900'>{t('common.email')}:</span>{' '}
                {appointment.doctorId?.email ? getEmailDisplayValue(appointment.doctorId.email, localeCode) : '—'}
              </p>
            </div>
          </Card>
        </div>

        <div className='content-grid-3 content-grid-gap-6 mb-6'>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              {t('appointments.date')}
            </h3>
            <p className='text-2xl font-bold text-neutral-900'>
              {formatDate(appointment.appointmentDate)}
            </p>
          </Card>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              {t('appointments.time')}
            </h3>
            <p className='text-xl font-semibold text-neutral-900'>
              {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
            </p>
          </Card>
          <Card>
            <h3 className='text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1'>
              {t('appointments.duration')}
            </h3>
            <p className='text-2xl font-bold text-neutral-900'>{appointment.duration || 30} {t('appointments.mins')}</p>
          </Card>
        </div>

        <div className='content-grid-2 content-grid-gap-6 mb-6'>
          <Card>
            <h3 className='text-lg font-semibold text-neutral-900 mb-3'>
              {t('appointments.reason')}
            </h3>
            <p className='text-neutral-700'>
              {appointment.reason && String(appointment.reason).includes(' - ')
                ? getDiagnosisDisplayValue(String(appointment.reason), localeCode)
                : (appointment.reason || t('appointments.reasonNotProvided'))}
            </p>
          </Card>

          <Card>
            <h3 className='text-lg font-semibold text-neutral-900 mb-3'>
              {t('appointments.notes')}
            </h3>
            <p className='text-neutral-700 whitespace-pre-wrap'>
              {appointment.notes || t('appointments.noAdditionalNotes')}
            </p>
          </Card>
        </div>

        {/* Consultation Notes for Doctors */}
        {isDoctor && (
          <Card className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-neutral-900'>
                {t('appointments.consultationNotes')}
              </h3>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setShowConsultationNotes(!showConsultationNotes)}
              >
                {showConsultationNotes ? t('common.hide') : t('appointments.addEditNotes')}
              </Button>
            </div>
            {showConsultationNotes ? (
              <div className='space-y-4'>
                <div>
                  <div className='flex items-center justify-between gap-2 mb-2'>
                    <label className='block text-sm font-medium text-neutral-700'>
                      {t('appointments.diagnosisLabel')}
                    </label>
                    <AiAssistSuggest
                      context='diagnosis'
                      onInsert={(text) => setDiagnosis((prev) => (prev ? `${prev}; ${text}` : text))}
                    />
                  </div>
                  <Input
                    type='text'
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder={t('appointments.diagnosisPlaceholder')}
                  />
                </div>
                <div>
                  <div className='flex items-center justify-between gap-2 mb-2'>
                    <label className='block text-sm font-medium text-neutral-700'>
                      {t('appointments.clinicalNotes')}
                    </label>
                    <AiAssistSuggest
                      context='clinical_notes'
                      onInsert={(text) =>
                        setConsultationNotes((prev) => (prev ? `${prev}\n${text}` : text))
                      }
                    />
                  </div>
                  <textarea
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    rows={6}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder={t('appointments.consultationNotesPlaceholder')}
                  />
                </div>
                <div className='flex justify-end gap-3'>
                  <Button variant='secondary' onClick={() => setShowConsultationNotes(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant='primary'
                    size='md'
                    onClick={handleSaveConsultationNotes}
                    disabled={saving}
                  >
                    {saving ? t('common.saving') : t('appointments.saveNotes')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className='text-neutral-600'>
                {consultationNotes ? (
                  <div>
                    {diagnosis && (
                      <p className='mb-2'>
                        <span className='font-semibold'>{t('appointments.diagnosisLabel')}:</span>{' '}
                        {getDiagnosisDisplayValue(String(diagnosis), localeCode)}
                      </p>
                    )}
                    <p className='whitespace-pre-wrap'>{consultationNotes}</p>
                  </div>
                ) : (
                  <p className='text-neutral-500 italic'>
                    {t('appointments.noConsultationNotesYet')}
                  </p>
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
                <h3 className='text-lg font-semibold text-neutral-900'>
                  {t('appointments.telemedicineSession')}
                </h3>
                <p className='text-neutral-700 mt-2'>
                  {t('appointments.sessionId')}:{' '}
                  <span className='font-mono text-sm'>
                    {appointment.telemedicineSessionId || t('appointments.pending')}
                  </span>
                </p>
                <p className='text-neutral-700 mt-1'>
                  {t('appointments.consentLabel')}:{' '}
                  {appointment.telemedicineConsent
                    ? t('appointments.consentCaptured')
                    : t('appointments.consentNotCaptured')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
