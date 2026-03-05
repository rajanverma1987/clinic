'use client';

import { CalendarIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { PatientSelector } from '@/components/ui/PatientSelector';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useFeatures } from '@/hooks/useFeatures.js';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { clearCacheByPrefix } from '@/lib/utils/api-cache';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess, showWarning } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function NewAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const { hasFeature } = useFeatures();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);

  // Check if telemedicine is available in subscription
  const hasTelemedicine = hasFeature('Telemedicine');

  // Get URL query parameters
  const patientIdFromUrl = searchParams?.get('patientId') || '';
  const doctorIdFromUrl = searchParams?.get('doctorId') || '';
  const dateFromUrl = searchParams?.get('date') || '';
  const startTimeFromUrl = searchParams?.get('startTime') || '';
  const endTimeFromUrl = searchParams?.get('endTime') || '';

  // Calculate duration from start and end time if provided
  const calculateDuration = (startTime, endTime) => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMinutes = Math.round((end - start) / (1000 * 60));
      return diffMinutes.toString();
    }
    return '30';
  };

  // Extract time from ISO string (HH:mm format)
  const extractTimeFromISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    patientId: patientIdFromUrl, // Pre-fill from URL if provided
    doctorId: doctorIdFromUrl, // Pre-fill from URL if provided
    appointmentDate: dateFromUrl, // Pre-fill from URL if provided
    startTime: extractTimeFromISO(startTimeFromUrl), // Extract time in HH:mm format
    duration: calculateDuration(startTimeFromUrl, endTimeFromUrl),
    type: 'consultation',
    isTelemedicine: false,
    telemedicineConsent: false,
    patientEmail: '',
    reason: '',
    notes: '',
    isRecurring: false,
    recurringFrequency: 'weekly',
    recurringEndDate: '',
    recurringOccurrences: 4,
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser]);

  // Update form data when URL parameters change or when data is loaded
  useEffect(() => {
    if (patientIdFromUrl && patients.length > 0) {
      // Verify patient exists in the list before setting
      const patientExists = patients.some((p) => p._id === patientIdFromUrl);
      if (patientExists) {
        const patient = patients.find((p) => p._id === patientIdFromUrl);
        setFormData((prev) => ({
          ...prev,
          patientId: patientIdFromUrl,
          // Auto-populate email if Video Consultation is selected
          patientEmail:
            formData.isTelemedicine && patient?.email ? patient.email : prev.patientEmail,
        }));
      }
    }
  }, [patientIdFromUrl, patients]);

  // Auto-populate patient email when patient is selected and Video Consultation is enabled
  useEffect(() => {
    if (formData.patientId && formData.isTelemedicine && patients.length > 0) {
      const selectedPatient = patients.find(
        (p) => p._id === formData.patientId || p.id === formData.patientId,
      );
      if (selectedPatient?.email) {
        // Always update email from patient collection when Video Consultation is enabled
        setFormData((prev) => ({ ...prev, patientEmail: selectedPatient.email }));
      }
    }
  }, [formData.patientId, formData.isTelemedicine, patients]);

  // Update doctorId when URL parameter changes or when doctors are loaded
  useEffect(() => {
    if (doctorIdFromUrl && doctors.length > 0) {
      // Verify doctor exists in the list before setting
      const doctorExists = doctors.some(
        (d) => d.id === doctorIdFromUrl || d._id === doctorIdFromUrl,
      );
      if (doctorExists) {
        setFormData((prev) => ({ ...prev, doctorId: doctorIdFromUrl }));
      }
    }
  }, [doctorIdFromUrl, doctors]);

  // Update date and time when URL parameters change
  useEffect(() => {
    if (dateFromUrl) {
      setFormData((prev) => ({ ...prev, appointmentDate: dateFromUrl }));
    }
    if (startTimeFromUrl) {
      // Extract time in HH:mm format for the time input
      const timeStr = extractTimeFromISO(startTimeFromUrl);
      setFormData((prev) => ({ ...prev, startTime: timeStr }));

      // Update duration if endTime is also provided
      if (endTimeFromUrl) {
        const duration = calculateDuration(startTimeFromUrl, endTimeFromUrl);
        setFormData((prev) => ({ ...prev, duration }));
      }
    }
  }, [dateFromUrl, startTimeFromUrl, endTimeFromUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients with pagination
      const patientsResponse = await apiClient.get('/patients?limit=1000'); // Get more patients for appointment booking

      if (patientsResponse.success && patientsResponse.data) {
        const { extractArrayData } = await import('@/lib/utils/api-response-extractor');
        const patientsList = extractArrayData(patientsResponse);
        setPatients(Array.isArray(patientsList) ? patientsList : []);
      }

      // Fetch all doctors and clinic admins (anyone who can conduct appointments)
      const doctorsResponse = await apiClient.get('/users'); // Fetch all users, we'll filter on frontend

      if (doctorsResponse.success && doctorsResponse.data) {
        const allUsers = doctorsResponse.data.data || [];

        logger.debug('Fetched users:', allUsers); // Debug log

        // Filter to only show active doctors and clinic admins
        const doctorsList = allUsers.filter(
          (u) => (u.role === 'doctor' || u.role === 'clinic_admin') && u.isActive,
        );

        logger.debug('Filtered doctors:', doctorsList); // Debug log

        setDoctors(doctorsList);

        // Pre-select doctor from URL if provided, otherwise use current user
        if (doctorIdFromUrl) {
          const urlDoctor = doctorsList.find(
            (d) => d.id === doctorIdFromUrl || d._id === doctorIdFromUrl,
          );
          if (urlDoctor) {
            setFormData((prev) => ({ ...prev, doctorId: urlDoctor.id || urlDoctor._id }));
          }
        } else if (currentUser?.role === 'doctor' || currentUser?.role === 'clinic_admin') {
          // Only pre-select current user if no doctorId from URL
          const currentDoctor = doctorsList.find(
            (d) => d.id === currentUser.userId || d._id === currentUser.userId,
          );
          if (currentDoctor) {
            setFormData((prev) => ({ ...prev, doctorId: currentDoctor.id || currentDoctor._id }));
          }
        }
      }
    } catch (error) {
      logger.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.patientId) {
        showError(t('errors.pleaseSelectPatient'));
        setSubmitting(false);
        return;
      }

      if (!formData.doctorId) {
        showError(t('errors.pleaseSelectDoctor'));
        setSubmitting(false);
        return;
      }

      if (!formData.appointmentDate) {
        showError(t('errors.pleaseSelectDate'));
        setSubmitting(false);
        return;
      }

      if (!formData.startTime) {
        showError(t('errors.pleaseSelectTime'));
        setSubmitting(false);
        return;
      }

      // Calculate end time from start time and duration
      const startDateTime = new Date(`${formData.appointmentDate}T${formData.startTime}`);
      const durationMinutes = parseInt(formData.duration);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // Validate telemedicine requirements
      if (formData.isTelemedicine) {
        if (!formData.telemedicineConsent) {
          showWarning(t('appointments.confirmVideoConsent'));
          setSubmitting(false);
          return;
        }
        if (!formData.patientEmail) {
          showWarning(t('appointments.patientEmailRequiredForVideo'));
          setSubmitting(false);
          return;
        }
      }

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationMinutes,
        type: formData.type,
        isTelemedicine: formData.isTelemedicine,
        telemedicineConsent: formData.telemedicineConsent,
        patientEmail: formData.patientEmail || undefined,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
        isRecurring: formData.isRecurring || false,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringEndDate:
          formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : undefined,
        recurringOccurrences:
          formData.isRecurring && !formData.recurringEndDate
            ? formData.recurringOccurrences
            : undefined,
      };

      const response = await apiClient.post('/appointments', appointmentData);
      if (response.success) {
        if (currentUser?.tenantId) {
          routeCache.clear('route_appointments', currentUser.tenantId);
        }
        clearCacheByPrefix('/appointments');
        const appointmentCount = formData.isRecurring ? formData.recurringOccurrences || 4 : 1;
        showSuccess(
          formData.isRecurring
            ? t('appointments.recurringScheduled', { count: appointmentCount })
            : formData.isTelemedicine
              ? t('appointments.videoScheduled')
              : t('appointments.scheduledSuccess'),
        );
        setTimeout(() => {
          router.push('/appointments?from=book');
        }, 1500);
      } else {
        const errorMsg = response.error?.message || t('errors.failedToCreateAppointment');

        if (errorMsg.includes('Cast to ObjectId failed') || errorMsg.includes('ObjectId')) {
          showError(t('errors.invalidSelectionRefresh'));
        } else if (errorMsg.includes('validation') || errorMsg.includes('required')) {
          showError(t('errors.pleaseFillRequired'));
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('exists')) {
          showError(t('errors.appointmentConflict'));
        } else {
          showError(errorMsg);
        }
      }
    } catch (error) {
      logger.error('Appointment creation error:', error);

      let errorMsg = t('errors.failedToCreateAppointmentRetry');

      if (error.message) {
        if (error.message.includes('Cast to ObjectId') || error.message.includes('ObjectId')) {
          errorMsg = t('errors.invalidSelectionRefresh');
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMsg = t('errors.networkError');
        } else if (error.message.includes('timeout')) {
          errorMsg = t('errors.requestTimeout');
        } else if (!error.message.includes('MongoDB') && !error.message.includes('Schema')) {
          errorMsg = error.message;
        }
      }

      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Show empty state while redirecting
  if (!currentUser) {
    return null;
  }

  if (loading) {
    return <Layout loading />;
  }

  return (
    <Layout>
      <PageHeader
        title={t('appointments.bookAppointment')}
        subtitle={t('appointments.appointmentList')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='w-full min-w-0 px-4 sm:px-6'>
        <Card className='p-5 sm:p-6 shadow-sm'>
          <form onSubmit={handleSubmit} className='space-y-4' noValidate>
            <div className='border-b border-neutral-200 dark:border-neutral-600 pb-4 mb-4'>
              <h2 className='text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3'>
                {t('appointments.appointmentDetails')}
              </h2>
              <div className='space-y-4'>
                <PatientSelector
                  patients={patients}
                  selectedPatientId={formData.patientId}
                  onSelect={(patientId) => {
                    const selectedPatient = patients.find(
                      (p) => p._id === patientId || p.id === patientId,
                    );
                    setFormData((prev) => ({
                      ...prev,
                      patientId,
                      patientEmail:
                        formData.isTelemedicine && selectedPatient?.email
                          ? selectedPatient.email
                          : prev.patientEmail,
                    }));
                  }}
                  onAddNew={() => router.push('/patients')}
                  label={t('appointments.patient')}
                  required
                  placeholder={t('appointments.searchPlaceholder')}
                />
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                  <div className='sm:col-span-2 lg:col-span-2'>
                    <Select
                      label={t('appointments.doctor')}
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      required
                      placeholder={t('common.select')}
                      options={[
                        { value: '', label: t('common.select'), disabled: true },
                        ...doctors.map((d) => {
                          const displayFirst =
                            locale === 'ar' && (d.firstName_ar ?? '')
                              ? d.firstName_ar
                              : locale === 'es' && (d.firstName_es ?? '')
                                ? d.firstName_es
                                : d.firstName || '';
                          const displayLast =
                            locale === 'ar' && (d.lastName_ar ?? '')
                              ? d.lastName_ar
                              : locale === 'es' && (d.lastName_es ?? '')
                                ? d.lastName_es
                                : d.lastName || '';
                          return {
                            value: d.id,
                            label: t('appointments.doctorNameFormat', {
                              firstName: displayFirst,
                              lastName: displayLast,
                            }),
                          };
                        }),
                      ]}
                    />
                    {doctors.length === 0 && (
                      <p className='text-xs text-neutral-500 mt-1'>
                        {t('appointments.noDoctorsAvailableAddInSettings')}
                      </p>
                    )}
                  </div>
                  <div>
                    <DatePicker
                      label={t('appointments.selectDate')}
                      required
                      value={formData.appointmentDate}
                      onChange={(e) =>
                        setFormData({ ...formData, appointmentDate: e.target.value })
                      }
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='startTime'
                      className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'
                    >
                      {t('appointments.time')} *
                    </label>
                    <Input
                      id='startTime'
                      type='time'
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Select
                      label={t('appointments.duration')}
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                      options={[
                        { value: '15', label: t('appointments.durationMin', { count: 15 }) },
                        { value: '30', label: t('appointments.durationMin', { count: 30 }) },
                        { value: '45', label: t('appointments.durationMin', { count: 45 }) },
                        { value: '60', label: t('appointments.durationMin', { count: 60 }) },
                        { value: '90', label: t('appointments.durationMin', { count: 90 }) },
                        { value: '120', label: t('appointments.durationMin', { count: 120 }) },
                      ]}
                    />
                  </div>
                  <div>
                    <Select
                      label={t('appointments.appointmentType')}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      options={[
                        { value: 'consultation', label: t('appointments.typeConsultation') },
                        { value: 'follow_up', label: t('appointments.typeFollowUp') },
                        { value: 'checkup', label: t('appointments.typeCheckup') },
                        { value: 'emergency', label: t('appointments.typeEmergency') },
                        { value: 'procedure', label: t('appointments.typeProcedure') },
                        { value: 'lab_test', label: t('appointments.typeLabTest') },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recurring */}
            <div className='border-b border-neutral-200 dark:border-neutral-600 pb-4 mb-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <Checkbox
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    size='md'
                  />
                  <span className='text-sm font-medium text-neutral-800 dark:text-neutral-200'>
                    {t('appointments.recurring')}
                  </span>
                </label>
                {formData.isRecurring && (
                  <>
                    <Select
                      value={formData.recurringFrequency}
                      onChange={(e) =>
                        setFormData({ ...formData, recurringFrequency: e.target.value })
                      }
                      options={[
                        { value: 'daily', label: t('appointments.recurringDaily') },
                        { value: 'weekly', label: t('appointments.recurringWeekly') },
                        { value: 'biweekly', label: t('appointments.recurringBiweekly') },
                        { value: 'monthly', label: t('appointments.recurringMonthly') },
                      ]}
                      className='w-36'
                    />
                    <DatePicker
                      value={formData.recurringEndDate}
                      onChange={(e) =>
                        setFormData({ ...formData, recurringEndDate: e.target.value })
                      }
                      min={formData.appointmentDate || new Date().toISOString().split('T')[0]}
                      placeholder={t('appointments.endDateOptional')}
                    />
                    {!formData.recurringEndDate && (
                      <Input
                        type='number'
                        min={2}
                        max={52}
                        value={formData.recurringOccurrences}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurringOccurrences: parseInt(e.target.value) || 4,
                          })
                        }
                        className='w-20'
                      />
                    )}
                  </>
                )}
              </div>
              {formData.isRecurring && (
                <p className='text-xs text-neutral-500 mt-2'>
                  {t('appointments.noteRecurring', { count: formData.recurringOccurrences || 4 })}{' '}
                  {formData.appointmentDate || t('appointments.recurringSelectedDate')}.
                </p>
              )}
            </div>

            {/* Consultation method */}
            <div className='border-b border-neutral-200 dark:border-neutral-600 pb-4 mb-4'>
              <h2 className='text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3'>
                {t('appointments.consultationMethod')}
              </h2>

              {/* If Telemedicine not available, show only In-Person (disabled) */}
              {!hasTelemedicine ? (
                <div>
                  <div className='p-4 border-2 border-primary-500 bg-primary-100 rounded-lg opacity-75 cursor-not-allowed'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-12 h-12 rounded-lg flex items-center justify-center bg-primary-600 ml-2'>
                        <svg
                          className='icon icon-md text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                          />
                        </svg>
                      </div>
                      <div className='text-left flex-1'>
                        <div className='font-semibold text-neutral-900'>
                          {t('appointments.inPersonVisit')}
                        </div>
                        <div className='text-sm text-neutral-600'>
                          {t('appointments.inPersonVisitDesc')}
                        </div>
                      </div>
                      <div className='flex items-center gap-2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full'>
                        ✓ {t('common.selected')}
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Notice */}
                  <div className='mt-4 p-4 bg-gradient-to-r from-primary-100 to-primary-100 border border-primary-200 rounded-lg'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-shrink-0'>
                        <svg
                          className='icon icon-md text-purple-600'
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
                      <div className='flex-1'>
                        <h4 className='font-semibold text-neutral-900 mb-1'>
                          {t('appointments.videoNotAvailableTitle')}
                        </h4>
                        <p className='text-sm text-neutral-700 mb-3'>
                          {t('appointments.videoNotAvailableDesc')}
                        </p>
                        <Button
                          type='button'
                          variant='primary'
                          size='sm'
                          href='/subscription'
                          className='inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 border-purple-600'
                        >
                          <svg
                            className='icon icon-xs'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                            />
                          </svg>
                          {t('staff.upgradePlan')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show both options if Telemedicine is available */
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    fullWidth
                    align='start'
                    onClick={() =>
                      setFormData({
                        ...formData,
                        isTelemedicine: false,
                        telemedicineConsent: false,
                      })
                    }
                    className={`p-4 border-2 rounded-lg h-auto ${
                      !formData.isTelemedicine
                        ? 'border-primary-500 bg-primary-100'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ml-2 ${
                          !formData.isTelemedicine ? 'bg-primary-600' : 'bg-neutral-200'
                        }`}
                      >
                        <svg
                          className={`icon icon-md ${
                            !formData.isTelemedicine ? 'text-white' : 'text-neutral-600'
                          }`}
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                          />
                        </svg>
                      </div>
                      <div className='text-left'>
                        <div className='font-semibold text-neutral-900'>
                          {t('appointments.inPersonVisit')}
                        </div>
                        <div className='text-sm text-neutral-600'>
                          {t('appointments.inPersonVisitDesc')}
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    type='button'
                    variant='ghost'
                    fullWidth
                    align='start'
                    onClick={() => {
                      // When Video Consultation is selected, auto-populate email from patient
                      const selectedPatient = patients.find(
                        (p) => p._id === formData.patientId || p.id === formData.patientId,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        isTelemedicine: true,
                        // Auto-populate email from patient collection
                        patientEmail: selectedPatient?.email || prev.patientEmail,
                      }));
                    }}
                    className={`p-4 border-2 rounded-lg h-auto ${
                      formData.isTelemedicine
                        ? 'border-primary-500 bg-primary-100'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ml-2 ${
                          formData.isTelemedicine ? 'bg-primary-600' : 'bg-neutral-200'
                        }`}
                      >
                        <svg
                          className={`icon icon-md ${
                            formData.isTelemedicine ? 'text-white' : 'text-neutral-600'
                          }`}
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
                      <div className='text-left'>
                        <div className='font-semibold text-neutral-900'>
                          {t('appointments.videoConsultation')}
                        </div>
                        <div className='text-sm text-neutral-600'>
                          {t('appointments.videoConsultationDesc')}
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              )}
            </div>

            {/* Video details */}
            {formData.isTelemedicine && (
              <div className='border-b border-neutral-200 dark:border-neutral-600 pb-4 mb-4'>
                <h2 className='text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3'>
                  {t('appointments.videoDetails')}
                </h2>
                <div className='space-y-3'>
                  <Input
                    label={t('appointments.patientEmailForVideo')}
                    type='email'
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    required
                    placeholder={t('appointments.patientEmailPlaceholder')}
                  />
                  <div className='rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 p-3'>
                    <label className='flex items-start gap-3 cursor-pointer'>
                      <Checkbox
                        checked={formData.telemedicineConsent}
                        onChange={(e) =>
                          setFormData({ ...formData, telemedicineConsent: e.target.checked })
                        }
                        size='sm'
                        required={formData.isTelemedicine}
                        className='mt-0.5'
                      />
                      <span className='text-sm text-neutral-700 dark:text-neutral-300'>
                        {t('appointments.videoConsentNotice')}{' '}
                        *
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Optional details */}
            <div className='border-b border-neutral-200 dark:border-neutral-600 pb-4 mb-4 last:border-0'>
              <h2 className='text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3'>
                {t('appointments.optionalDetails')}
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <Input
                  label={t('appointments.reason')}
                  id='reason'
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t('appointments.reasonPlaceholder')}
                />
                <div>
                  <Textarea
                    label={t('appointments.notes')}
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('appointments.notesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className='flex flex-wrap gap-3 pt-2'>
              <Button
                type='submit'
                variant='primary'
                size='lg'
                isLoading={submitting}
                disabled={submitting}
                className='rounded-xl px-6'
              >
                <CalendarIcon className='icon icon-sm' ariaHidden />
                {t('appointments.bookAppointment')}
              </Button>
              <Button
                type='button'
                variant='primary'
                size='lg'
                disabled={submitting}
                className='rounded-xl px-6'
                onClick={() => router.back()}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function AppointmentPageFallback() {
  const { t } = useI18n();
  return <Layout loading />;
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<AppointmentPageFallback />}>
      <NewAppointmentPageContent />
    </Suspense>
  );
}
