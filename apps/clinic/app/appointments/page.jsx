'use client';

import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';
import { EyeIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useInvalidateDashboard } from '@/hooks/useInvalidateDashboard';
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { clearCacheByPrefix } from '@/lib/utils/api-cache';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { getPatientDisplayName as getPatientDisplayNameUtil } from '@/lib/utils/patient-display-name';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ROUTE_KEY = 'route_appointments';

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get('date') || '';
  const { user, loading: authLoading } = useAuth();
  const { t, locale: uiLocale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const locale = uiLocale || settingsLocale;
  const { invalidateLists, invalidateStats } = useInvalidateDashboard();
  const { prefetchAppointment } = usePrefetchDetail();
  const tenantId = user?.tenantId ?? null;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const localeCode = (locale || '').slice(0, 2);
    if (localeCode === 'es' || localeCode === 'ar') return; // always fetch when UI needs localized patient names
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    const list = cached?.appointments;
    if (cached && Array.isArray(list) && list.length > 0) {
      setAppointments(list);
      setCurrentPage(cached.currentPage ?? 1);
      setTotalPages(cached.totalPages ?? 1);
      setLoading(false);
    }
  }, [tenantId, locale]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);
  const [doctorIdInitialized, setDoctorIdInitialized] = useState(false);
  const [loadingAppointmentId, setLoadingAppointmentId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // { id, patientName }
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/settings');
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        logger.error('Failed to fetch settings', error);
      }
    };
    if (!authLoading && user) {
      fetchSettings();
    }
  }, [authLoading, user]);

  // Fetch doctors list for clinic_admin (includes both 'doctor' and 'clinic_admin' roles)
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!authLoading && user && (user.role === 'clinic_admin' || user.role === 'super_admin')) {
        try {
          // Fetch both doctors and clinic_admins (since clinic_admin is also a doctor)
          const [doctorsResponse, clinicAdminsResponse] = await Promise.all([
            apiClient.get('/users?role=doctor'),
            apiClient.get('/users?role=clinic_admin'),
          ]);

          let allDoctors = [];

          // Extract doctors from first response
          if (doctorsResponse.success && doctorsResponse.data) {
            const doctorsList = extractArrayData(doctorsResponse);
            allDoctors = [...allDoctors, ...doctorsList];
          }

          // Extract clinic_admins from second response
          if (clinicAdminsResponse.success && clinicAdminsResponse.data) {
            const clinicAdminsList = extractArrayData(clinicAdminsResponse);
            allDoctors = [...allDoctors, ...clinicAdminsList];
          }

          if (Array.isArray(allDoctors) && allDoctors.length > 0) {
            // Filter only active doctors (isActive !== false means include undefined/null/true)
            const activeDoctors = allDoctors.filter((d) => d && d.isActive !== false);
            setDoctors(activeDoctors);
          } else {
            setDoctors([]);
          }
        } catch (error) {
          logger.error('Failed to fetch doctors', error);
          setDoctors([]);
        }
      } else {
        // If not clinic_admin, clear doctors list
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, [authLoading, user]);

  // Set selected doctor to current user by default (for all roles) - only on initial load
  useEffect(() => {
    if (user && !doctorIdInitialized) {
      // Only role "doctor" filters to own schedule; clinic_admin/receptionist/super_admin see all
      const role = user.role;
      if (role === 'doctor') {
        setSelectedDoctorId(user.userId || '');
      } else {
        setSelectedDoctorId('');
      }
      setDoctorIdInitialized(true);
    }
  }, [user, doctorIdInitialized]);

  // After booking: clear doctor filter, clear cache, refetch (no doctor filter), then drop ?from=book
  const fromBook = searchParams.get('from') === 'book';
  useEffect(() => {
    if (!fromBook || !user) return;
    setSelectedDoctorId('');
    if (tenantId) routeCache.clear(ROUTE_KEY, tenantId);
    clearCacheByPrefix('/appointments');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    const newPath = params.toString() ? `/appointments?${params}` : '/appointments';
    router.replace(newPath, { scroll: false });
    setLoading(true);
    const q = new URLSearchParams({ page: '1', limit: '10' });
    if (selectedStatus) q.append('status', selectedStatus);
    if (dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)) q.append('date', dateFromUrl);
    const localeCode = (locale || '').slice(0, 2);
    if (localeCode) q.append('locale', localeCode);
    apiClient
      .get(`/appointments?${q}`)
      .then((response) => {
        if (response?.success && response?.data) {
          const list = extractArrayData(response) || [];
          setAppointments(Array.isArray(list) ? list : []);
          setCurrentPage(1);
          const pages = response.data.pagination?.totalPages ?? 1;
          setTotalPages(pages);
          if (tenantId) routeCache.set(ROUTE_KEY, tenantId, { appointments: list, currentPage: 1, totalPages: pages });
        }
      })
      .catch((err) => logger.error('Failed to fetch appointments after book', err))
      .finally(() => setLoading(false));
  }, [fromBook, user, tenantId, router, searchParams, selectedStatus, dateFromUrl]);

  const formatDateDisplay = useCallback(
    (date, options) => {
      try {
        return new Intl.DateTimeFormat(locale || 'en-US', {
          timeZone: settings?.settings?.timezone || 'UTC',
          ...options,
        }).format(date);
      } catch (error) {
        logger.error('Failed to format date', error);
        return date.toLocaleDateString();
      }
    },
    [settings, locale],
  );

  const formatTimeDisplay = useCallback(
    (date, options = { hour: '2-digit', minute: '2-digit' }) => {
      try {
        return new Intl.DateTimeFormat(locale || 'en-US', {
          timeZone: settings?.settings?.timezone || 'UTC',
          ...options,
        }).format(date);
      } catch (error) {
        logger.error('Failed to format time', error);
        return date.toLocaleTimeString();
      }
    },
    [settings, locale],
  );

  const formatDateForApi = useCallback(
    (date) => {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: settings?.settings?.timezone || 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
      } catch {
        return date.toISOString().split('T')[0];
      }
    },
    [settings],
  );

  const fetchStats = useCallback(async () => {
    if (!settings) return; // Wait for settings to load

    setStatsLoading(true);
    try {
      const timezone = settings.settings.timezone || 'UTC';
      const now = new Date();

      // Format today's date in clinic timezone as YYYY-MM-DD
      // Use Intl.DateTimeFormat to ensure correct timezone handling
      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      // Get tomorrow by adding 1 day
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(tomorrowDate);

      // Fetch counts using the appointments API with date filter
      // Exclude video consultations from stats (they go to queue)
      const [todayResponse, tomorrowResponse] = await Promise.all([
        apiClient.get(`/appointments?page=1&limit=1000&date=${todayStr}`),
        apiClient.get(`/appointments?page=1&limit=1000&date=${tomorrowStr}`),
      ]);

      // Filter out video consultations from counts
      const todayList = extractArrayData(todayResponse);
      const tomorrowList = extractArrayData(tomorrowResponse);

      const todayTotal = todayList.filter(
        (apt) => !apt.isTelemedicine && apt.status !== 'arrived',
      ).length;
      const tomorrowTotal = tomorrowList.filter(
        (apt) => !apt.isTelemedicine && apt.status !== 'arrived',
      ).length;

      setTodayCount(todayTotal);
      setTomorrowCount(tomorrowTotal);
    } catch (error) {
      logger.error('Failed to fetch stats', error);
    } finally {
      setStatsLoading(false);
    }
  }, [settings]);

  const fetchAppointments = useCallback(
    async (silentRefresh = false) => {
      const hasDateFilter = dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl);
      const localeCode = (locale || '').slice(0, 2);
      const useCache = localeCode !== 'es' && localeCode !== 'ar';
      const hasCache = useCache && tenantId && !hasDateFilter && routeCache.getData(ROUTE_KEY, tenantId);
      if (!silentRefresh && !hasCache) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });
        if (selectedDoctorId) params.append('doctorId', selectedDoctorId);
        if (selectedStatus) params.append('status', selectedStatus);
        if (hasDateFilter) params.append('date', dateFromUrl);
        params.append('locale', localeCode || 'en');

        const response = await apiClient.get(`/appointments?${params}`);
        if (response.success && response.data) {
          const appointmentsList = extractArrayData(response);
          const list = Array.isArray(appointmentsList) ? appointmentsList : [];
          const pages = response.data.pagination?.totalPages || 1;
          setAppointments(list);
          setTotalPages(pages);
          if (tenantId && !hasDateFilter && useCache)
            routeCache.set(ROUTE_KEY, tenantId, {
              appointments: list,
              currentPage,
              totalPages: pages,
            });
        }
      } catch (error) {
        logger.error('Failed to fetch appointments', error);
      } finally {
        if (!silentRefresh) setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, selectedDoctorId, selectedStatus, tenantId, dateFromUrl, locale],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !fromBook) {
      clearCacheByPrefix('/appointments');
      fetchAppointments();
    }
  }, [authLoading, user, router, fetchAppointments, fromBook]);

  // Refetch appointments when UI language changes so patient names use the new locale (es/ar)
  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (!user || authLoading) return;
    const localeCode = (locale || '').slice(0, 2);
    const prevCode = (prevLocaleRef.current || '').slice(0, 2);
    if (localeCode !== prevCode) {
      prevLocaleRef.current = locale;
      clearCacheByPrefix('/appointments');
      fetchAppointments(true);
    } else {
      prevLocaleRef.current = locale;
    }
  }, [locale, user, authLoading, fetchAppointments]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && user && !dateFromUrl && !selectedStatus && !selectedDoctorId) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchAppointments(true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, dateFromUrl, selectedStatus, selectedDoctorId, fetchAppointments]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments(false);
  }, [fetchAppointments]);

  // Fetch stats separately when settings are loaded
  useEffect(() => {
    if (settings) {
      fetchStats();
    }
  }, [settings, fetchStats]);

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return;
    const { id, patientName: name } = cancelTarget;
    setLoadingAppointmentId(id);
    try {
      const response = await apiClient.put(`/appointments/${id}/status`, {
        status: 'cancelled',
        cancellationReason: reason,
      });
      if (response.success) {
        setCancelTarget(null);
        invalidateLists();
        invalidateStats();
        showSuccess(t('appointments.cancelledFor', { name: name || 'patient' }));
        await apiClient.clearCacheForEndpoint('/appointments');
        await fetchAppointments();
        await fetchStats();
      } else {
        showError(response.error?.message || t('appointments.cancelFailed'));
      }
    } catch (error) {
      logger.error('Failed to cancel appointment', error);
      showError(error.message || t('appointments.cancelFailed'));
    } finally {
      setLoadingAppointmentId(null);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus, patientName) => {
    // Set loading state for this specific appointment
    setLoadingAppointmentId(appointmentId);

    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        invalidateLists();
        invalidateStats();
        await apiClient.clearCacheForEndpoint('/appointments');
        // Show success message based on status
        if (newStatus === 'arrived') {
          showSuccess(t('appointments.markedArrivedQueue', { name: patientName || 'Patient' }));
          await fetchAppointments();
          await fetchStats();
          setLoadingAppointmentId(null);
        } else if (newStatus === 'in_progress') {
          showSuccess(t('appointments.startedFor', { name: patientName || 'patient' }));
          await fetchAppointments();
          setLoadingAppointmentId(null);
        } else if (newStatus === 'completed') {
          showSuccess(t('appointments.completedFor', { name: patientName || 'patient' }));
          await fetchAppointments();
          await fetchStats();
          setLoadingAppointmentId(null);
        } else if (newStatus === 'cancelled') {
          showSuccess(t('appointments.cancelledFor', { name: patientName || 'patient' }));
          await fetchAppointments();
          await fetchStats();
          setLoadingAppointmentId(null);
        } else {
          showSuccess(t('appointments.statusUpdatedSuccess'));
          await fetchAppointments();
          setLoadingAppointmentId(null);
        }
      } else {
        // Handle error from API response
        const errorMessage = response.error?.message || t('appointments.updateFailed');
        // If it's a duplicate queue error but appointment was updated, show success
        if (errorMessage.includes('duplicate') && errorMessage.includes('queue')) {
          showSuccess(t('appointments.markedArrivedAlready', { name: patientName || 'Patient' }));
          await apiClient.clearCacheForEndpoint('/appointments');
          await fetchAppointments();
          await fetchStats();
          setLoadingAppointmentId(null);
        } else {
          showError(errorMessage);
          setLoadingAppointmentId(null);
        }
      }
    } catch (error) {
      logger.error('Failed to update appointment status', error);
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        t('appointments.updateFailedTryAgain');

      // If it's a duplicate queue error, show a more user-friendly message
      if (errorMessage.includes('duplicate') && errorMessage.includes('queue')) {
        showSuccess(t('appointments.alreadyInQueue', { name: patientName || 'Patient' }));
        await apiClient.clearCacheForEndpoint('/appointments');
        await fetchAppointments();
        await fetchStats();
        setLoadingAppointmentId(null);
      } else {
        showError(errorMessage);
        setLoadingAppointmentId(null);
      }
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
      in_queue: t('appointments.inQueue'),
      no_show: t('appointments.noShow'),
    };
    return statusMap[status] || status;
  };

  const getTypeLabel = (type) => {
    if (!type) return '—';
    const normalized = String(type).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const keyMap = {
      consultation: 'typeConsultation',
      follow_up: 'typeFollowUp',
      followup: 'typeFollowUp',
      checkup: 'typeCheckup',
      emergency: 'typeEmergency',
      new_patient: 'typeNewPatient',
      newpatient: 'typeNewPatient',
      routine: 'typeRoutine',
    };
    const key = keyMap[normalized];
    return key ? t(`appointments.${key}`) : type;
  };

  const getPatientDisplayName = useCallback(
    (row) => getPatientDisplayNameUtil(row, locale, t),
    [locale, t],
  );

  const columns = [
    {
      header: t('appointments.patient'),
      accessor: (row) => getPatientDisplayName(row),
    },
    {
      header: t('appointments.doctor'),
      accessor: (row) => {
        const d = row.doctorId;
        const name =
          d && (d.firstName != null || d.lastName != null)
            ? `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim()
            : '';
        if (!name) return t('common.unknownDoctor');
        const lower = name.toLowerCase();
        if (lower === 'doctor' || lower === 'unknown' || lower === 'unknown doctor' || lower === 'n/a') return t('common.unknownDoctor');
        return name;
      },
    },
    {
      header: t('appointments.date'),
      accessor: (row) => {
        const dateSource = row.startTime || row.appointmentDate;
        return dateSource
          ? formatDateDisplay(new Date(dateSource), {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—';
      },
    },
    {
      header: t('appointments.time'),
      accessor: (row) =>
        row.startTime && row.endTime
          ? `${formatTimeDisplay(new Date(row.startTime))} - ${formatTimeDisplay(new Date(row.endTime))}`
          : '—',
    },
    {
      header: t('appointments.type'),
      accessor: (row) => getTypeLabel(row.type),
    },
    {
      header: t('appointments.method'),
      accessor: (row) => (
        <Tag
          variant={row.isTelemedicine ? 'default' : 'success'}
          size='sm'
          className='flex items-center gap-1 w-fit'
        >
          {row.isTelemedicine ? (
            <>
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
              {t('appointments.video')}
            </>
          ) : (
            <>
              <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
              {t('appointments.inPerson')}
            </>
          )}
        </Tag>
      ),
    },
    {
      header: t('appointments.status'),
      accessor: (row) => {
        const statusVariant =
          row.status === 'completed'
            ? 'success'
            : row.status === 'cancelled'
              ? 'danger'
              : row.status === 'in_progress' || row.status === 'arrived'
                ? 'primary'
                : 'default';
        return (
          <Tag variant={statusVariant} size='sm'>
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
    {
      header: t('common.actions'),
      accessor: (row) => {
        const patientName = getPatientDisplayName(row);
        const menuItems = [
          {
            key: 'view',
            label: t('common.view'),
            icon: <EyeIcon className='icon icon-sm' />,
            onClick: () => router.push(`/appointments/${row._id}`),
          },
          ...(row.status === 'scheduled' || row.status === 'confirmed'
            ? [
                {
                  key: 'markArrived',
                  label: t('appointments.markArrived'),
                  onClick: () => handleStatusChange(row._id, 'arrived', patientName),
                  disabled: loadingAppointmentId === row._id,
                },
                {
                  key: 'cancel',
                  label: t('appointments.cancelAppointment'),
                  icon: <XIcon className='icon icon-sm' />,
                  onClick: () => setCancelTarget({ id: row._id, patientName }),
                  disabled: loadingAppointmentId === row._id,
                  danger: true,
                },
              ]
            : []),
        ];
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              ariaLabel={t('common.actions')}
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
        title={t('appointments.title')}
        subtitle={formatDateDisplay(new Date(), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        notifications={[]}
        unreadCount={0}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        actionButton={
          <Button
            href='/appointments/new'
            variant='primary'
            size='md'
            className='whitespace-nowrap'
          >
            + {t('appointments.bookAppointment')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {loading ? (
          <>
            {/* Filters Section Skeleton */}
            <Card className='mb-6 p-4'>
              <div className='filter-row filter-row-items-end'>
                <div className='w-auto min-w-0'>
                  <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-32 mb-2' />
                  <div className='h-10 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-48' />
                </div>
                <div className='w-auto min-w-0'>
                  <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-24 mb-2' />
                  <div className='h-10 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-40' />
                </div>
              </div>
            </Card>
            {/* Stats Cards Skeleton */}
            <div className='content-grid-2 mb-6'>
              <Card className='bg-neutral-100 dark:bg-neutral-800'>
                <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-32 mb-2' />
                <div className='h-12 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-24 mb-2' />
                <div className='h-3 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-48' />
              </Card>
              <Card className='bg-neutral-100 dark:bg-neutral-800'>
                <div className='h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-36 mb-2' />
                <div className='h-12 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-24 mb-2' />
                <div className='h-3 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-56' />
              </Card>
            </div>
            {/* Table Skeleton */}
            <Card>
              <TableSkeleton rows={10} cols={5} />
            </Card>
          </>
        ) : (
          <>
            {/* Filters Section */}
            <Card className='mb-6 p-4'>
              <div className='filter-row filter-row-items-end'>
                {/* Doctor Filter - Only for clinic_admin */}
                {(user?.role === 'clinic_admin' || user?.role === 'super_admin') && (
                  <div className='w-auto min-w-0'>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        setCurrentPage(1);
                      }}
                      className='filter-select'
                      aria-label={t('appointments.filterByDoctor')}
                    >
                      <option value=''>
                        {t('appointments.filterByDoctor')}
                      </option>
                      {doctors && Array.isArray(doctors) && doctors.length > 0 ? (
                        doctors.map((doctor) => {
                          // Handle both id and _id properties
                          const doctorId = doctor.id || doctor._id?.toString() || '';
                          const doctorName =
                            `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() ||
                            doctor.email ||
                            t('common.unknownDoctor');
                          return (
                            <option key={doctorId} value={doctorId}>
                              {doctorName}
                            </option>
                          );
                        })
                      ) : (
                        <option value='' disabled>
                          {doctors === null || doctors === undefined
                            ? t('appointments.loadingDoctors')
                            : t('appointments.noDoctorsAvailable')}
                        </option>
                      )}
                    </select>
                  </div>
                )}

                {/* Status Filter - For all roles */}
                <div className='w-auto min-w-0'>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className='filter-select'
                    aria-label={t('appointments.filterByStatus')}
                  >
                    <option value=''>
                      {t('appointments.filterByStatus')}
                    </option>
                    <option value='scheduled'>{t('appointments.scheduled')}</option>
                    <option value='confirmed'>{t('appointments.confirmed')}</option>
                    <option value='in_progress'>{t('appointments.inProgress')}</option>
                    <option value='completed'>{t('appointments.completed')}</option>
                    <option value='cancelled'>{t('appointments.cancelled')}</option>
                  </select>
                </div>

                {/* Toggle Calendar Button - For receptionist and doctor */}
                {(user?.role === 'receptionist' ||
                  user?.role === 'doctor' ||
                  user?.role === 'clinic_admin' ||
                  user?.role === 'super_admin') && (
                  <div className='flex items-end'>
                    <Button
                      variant='secondary'
                      onClick={() => setShowCalendar(!showCalendar)}
                      className='filter-button whitespace-nowrap'
                    >
                      {showCalendar
                        ? t('appointments.hideCalendar')
                        : t('appointments.showCalendar')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className='content-grid-2 mb-6'>
              <Card className='bg-primary-100 border border-primary-300'>
                <p className='text-body-sm font-medium text-primary-700 mb-2'>
                  {t('appointments.todaysAppointments')}
                </p>
                <div className='flex items-baseline gap-3'>
                  <p className='text-h1 font-bold text-primary-900'>
                    {statsLoading ? '—' : todayCount}
                  </p>
                  <span className='text-body-sm text-primary-700'>
                    {formatDateDisplay(new Date(), {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className='text-body-xs text-primary-500 mt-3'>
                  {t('appointments.includesToday')}
                </p>
              </Card>

              <Card className='bg-secondary-100 border border-secondary-300'>
                <p className='text-body-sm font-medium text-secondary-700 mb-2'>
                  {t('appointments.tomorrowsAppointments')}
                </p>
                <div className='flex items-baseline gap-3'>
                  <p className='text-h1 font-bold text-secondary-700'>
                    {statsLoading ? '—' : tomorrowCount}
                  </p>
                  <span className='text-body-sm text-secondary-700'>
                    {formatDateDisplay(new Date(new Date().setDate(new Date().getDate() + 1)), {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className='text-body-xs text-secondary-500 mt-3'>
                  {t('appointments.includesTomorrow')}
                </p>
              </Card>
            </div>

            {/* Calendar Section - Show for receptionist, doctor, and clinic_admin */}
            {showCalendar &&
              (user?.role === 'receptionist' ||
                user?.role === 'doctor' ||
                user?.role === 'clinic_admin' ||
                user?.role === 'super_admin') && (
                <div className='mb-6'>
                  <AppointmentCalendar
                    selectedDoctorId={
                      selectedDoctorId || (user?.role === 'doctor' ? user.userId : '')
                    }
                    selectedDate={
                      dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)
                        ? new Date(dateFromUrl + 'T12:00:00')
                        : new Date()
                    }
                    onSlotSelect={(slot) => {
                      // Navigate to new appointment page with pre-filled data
                      const dateStr = slot.date.toISOString().split('T')[0];
                      const startTimeStr = slot.startTime.toISOString();
                      const endTimeStr = slot.endTime.toISOString();
                      const doctorIdParam =
                        selectedDoctorId || (user?.role === 'doctor' ? user.userId : '') || '';

                      // Build URL with query parameters
                      const params = new URLSearchParams();
                      if (doctorIdParam) params.append('doctorId', doctorIdParam);
                      params.append('date', dateStr);
                      params.append('startTime', startTimeStr);
                      params.append('endTime', endTimeStr);

                      router.push(`/appointments/new?${params.toString()}`);
                    }}
                    settings={settings?.settings}
                  />
                </div>
              )}

            {dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl) && (
              <div className='mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm'>
                <span className='text-primary-800'>
                  {t('appointments.showingForDate').replace(
                    '{{date}}',
                    formatDateDisplay(new Date(dateFromUrl + 'T12:00:00'), {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }),
                  )}
                </span>
                <Button
                  type='button'
                  variant='link'
                  href='/appointments'
                  className='font-medium text-primary-700 hover:text-primary-900'
                >
                  {t('appointments.showAllAppointments')}
                </Button>
              </div>
            )}

            <Card>
              <Table
                data={appointments}
                columns={columns}
                onRowClick={(row) => router.push(`/appointments/${row._id}`)}
                onRowMouseEnter={(row) => row?._id && prefetchAppointment(row._id)}
                emptyMessage={t('common.noDataFound')}
              />

              {totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between'>
                  <Button
                    variant='secondary'
                    size='md'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='whitespace-nowrap'
                  >
                    {t('common.previous')}
                  </Button>
                  <span className='text-body-sm text-neutral-700'>
                    {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                  </span>
                  <Button
                    variant='secondary'
                    size='md'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className='whitespace-nowrap'
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        patientName={cancelTarget?.patientName}
        loading={!!loadingAppointmentId}
      />
    </Layout>
  );
}
