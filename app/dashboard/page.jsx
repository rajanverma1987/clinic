'use client';

import { StarIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfilerWrapper } from '@/components/ProfilerWrapper';
import { StaleDataBanner } from '@/components/StaleDataBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { UpdatesAvailableBanner } from '@/components/UpdatesAvailableBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { useUpdatesAvailable } from '@/hooks/useUpdatesAvailable';
import { apiClient } from '@/lib/api/client';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { Suspense, lazy, useCallback, useEffect, useRef, useState, useTransition } from 'react';

// Dashboard components – critical path
import { AppointmentListItem } from './components/AppointmentListItem';
import { AppointmentRequestCard } from './components/AppointmentRequestCard';
import { DashboardListCard } from './components/DashboardListCard';
import { InventoryListItem } from './components/InventoryListItem';
import { InvoiceListItem } from './components/InvoiceListItem';
import { NextPatientCard } from './components/NextPatientCard';
import { PatientListItem } from './components/PatientListItem';
import { PatientsReviewCard } from './components/PatientsReviewCard';
import { PatientsSummaryChart } from './components/PatientsSummaryChart';
import { QuickActions } from './components/QuickActions';
import { StatsCard } from './components/StatsCard';

// Code splitting: lazy load heavy dashboard sections
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ChartCard = lazy(() =>
  import('./components/ChartCard').then((m) => ({ default: m.ChartCard }))
);
const CalendarWidget = lazy(() =>
  import('./components/CalendarWidget').then((m) => ({ default: m.CalendarWidget }))
);
const CriticalAlerts = lazy(() =>
  import('./components/CriticalAlerts').then((m) => ({ default: m.CriticalAlerts }))
);

// Custom hooks – SWR for clinic (real-time + 30s poll), existing for doctor
import {
  useDashboardChartsSWR,
  useDashboardListsSWR,
  useDashboardStatsSWR,
} from '@/hooks/useSWRDashboard';
import { useDoctorDashboardLists } from './hooks/useDoctorDashboardLists';
import { useDoctorDashboardStats } from './hooks/useDoctorDashboardStats';

/* Dashboard styles loaded by app/dashboard/layout.jsx for reliable load on client nav */

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const tenantId = user?.tenantId ?? null;

  // Check if user is a doctor – clinic SWR hooks get null so they don't fetch (saves 13 API calls)
  const isDoctor = user?.role === 'doctor';
  const clinicTenantId = isDoctor ? null : tenantId;

  // Defer charts so stats + lists load first (faster first paint); must be declared before useDashboardChartsSWR
  const [chartsEnabled, setChartsEnabled] = useState(false);

  const handleStartVideo = useCallback(async (appointment) => {
    if (!appointment?._id) return;
    try {
      let sessionId = appointment.telemedicineSessionId;
      if (!sessionId) {
        const response = await apiClient.post('/telemedicine/sessions', {
          appointmentId: appointment._id,
          patientId: appointment.patientId?._id || appointment.patientId,
          doctorId: appointment.doctorId?._id || appointment.doctorId,
          scheduledStartTime: appointment.startTime || appointment.appointmentDate || new Date(),
          scheduledEndTime: appointment.endTime || new Date(),
          sessionType: 'video',
        });
        if (response.success && response.data) {
          sessionId = response.data._id;
          await apiClient.put(`/appointments/${appointment._id}`, {
            telemedicineSessionId: sessionId,
          });
        } else {
          showError(response.error?.message || 'Failed to create video session');
          return;
        }
      }
      if (sessionId) {
        window.open(`/telemedicine/${sessionId}?role=doctor`, '_blank');
      } else {
        showError('Unable to start video session');
      }
    } catch (error) {
      showError(error.message || 'Failed to start video session');
    }
  }, []);

  // Clinic: SWR only when !isDoctor (pass clinicTenantId=null for doctors to avoid 13 extra requests)
  const clinicStatsSWR = useDashboardStatsSWR(clinicTenantId);
  const doctorStats = useDoctorDashboardStats();
  const stats = isDoctor ? doctorStats.stats : clinicStatsSWR.stats;
  const statsLoading = isDoctor ? doctorStats.loading : clinicStatsSWR.loading;
  const fetchStats = isDoctor ? doctorStats.fetchStats : clinicStatsSWR.fetchStats;

  const clinicChartsSWR = useDashboardChartsSWR(clinicTenantId, { enabled: chartsEnabled });
  const chartData = isDoctor
    ? { revenue: [], appointments: [], patients: [] }
    : (clinicChartsSWR.chartData ?? { revenue: [], appointments: [], patients: [] });
  const chartsLoading = isDoctor ? false : clinicChartsSWR.loading;
  const fetchChartData = isDoctor ? () => Promise.resolve() : clinicChartsSWR.fetchChartData;

  const clinicListsSWR = useDashboardListsSWR(clinicTenantId);
  const doctorLists = useDoctorDashboardLists();
  const generalLists = isDoctor ? doctorLists : clinicListsSWR;
  const { updatesAvailable, applyUpdates } = useUpdatesAvailable(
    clinicListsSWR.listsData,
    clinicListsSWR.isValidating,
    clinicListsSWR.fetchDashboardLists
  );
  const [isPending, startTransition] = useTransition();

  // Use doctor-specific lists if doctor, otherwise general lists
  const todayAppointments = isDoctor
    ? doctorLists.todayAppointments
    : generalLists.todayAppointments;
  const recentPatients = isDoctor ? doctorLists.recentPatients : generalLists.recentPatients;
  const overdueInvoices = isDoctor ? [] : generalLists.overdueInvoices;
  const lowStockList = isDoctor ? [] : generalLists.lowStockList;
  const prescriptionRefills = isDoctor ? [] : generalLists.prescriptionRefills;
  const queueStatus = isDoctor
    ? { active: 0, waiting: 0, inProgress: 0 }
    : generalLists.queueStatus;
  const criticalAlerts = (isDoctor ? [] : generalLists.criticalAlerts) ?? [];
  const expiringLots = isDoctor ? [] : generalLists.expiringLots;
  const appointmentRequests = isDoctor ? [] : generalLists.appointmentRequests;
  const listsLoading = isDoctor ? doctorLists.loading : generalLists.loading;
  const fetchDashboardLists = isDoctor
    ? doctorLists.fetchDashboardLists
    : generalLists.fetchDashboardLists;

  // Doctor-specific data
  const upcomingAppointments = isDoctor ? doctorLists.upcomingAppointments : [];
  const pendingReviews = isDoctor ? doctorLists.pendingReviews : [];
  const newPatientRequests = isDoctor ? doctorLists.newPatientRequests : [];

  const refreshIntervalRef = useRef(null);
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => setChartsEnabled(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Auto-refresh (silent, no flicker) – uses standard interval from lib/constants/dashboard
  useEffect(() => {
    if (authLoading || !user || !hasFetchedRef.current) return;

    const runRefresh = () => {
      if (hasFetchedRef.current) {
        fetchStats().catch(() => {});
        fetchDashboardLists().catch(() => {});
        if (!isDoctor) {
          fetchChartData().catch(() => {});
        }
      }
    };

    refreshIntervalRef.current = setInterval(runRefresh, DASHBOARD_AUTO_REFRESH_MS);

    // Pause when tab hidden to avoid needless work
    const handleVisibility = () => {
      if (document.hidden) {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        if (!refreshIntervalRef.current && hasFetchedRef.current) {
          runRefresh();
          refreshIntervalRef.current = setInterval(runRefresh, DASHBOARD_AUTO_REFRESH_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Refetch when window gains focus (e.g. user returns from adding a patient elsewhere)
    const handleFocus = () => {
      if (hasFetchedRef.current) {
        fetchStats().catch(() => {});
        fetchDashboardLists().catch(() => {});
        if (!isDoctor) {
          fetchChartData().catch(() => {});
        }
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [authLoading, user, isDoctor]); // Removed function dependencies

  // Redirect when no user or super_admin; mark ready so refresh interval can run (SWR fetches on mount – no duplicate fetch)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const timer = setTimeout(() => router.push('/login'), 100);
      return () => clearTimeout(timer);
    }

    if (user.role === 'super_admin') {
      router.push('/admin');
      return;
    }

    hasFetchedRef.current = true;
  }, [authLoading, user, router]);

  // Utility functions
  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const formatDateDisplay = () => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading states - these can be early returns AFTER all hooks
  if (authLoading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-screen'>
          <Loader size='lg' text={t('auth.redirectingToLogin')} />
        </div>
      </Layout>
    );
  }

  // Render dashboard shell immediately; sections show their own skeletons until data arrives (lightning-fast first paint)
  // Prepare notifications for PageHeader
  const notifications = criticalAlerts.map((alert, index) => ({
    id: `alert-${index}`,
    type: alert.type || 'system',
    title: alert.message || t('common.alert'),
    message: alert.message || '',
    unread: true,
    createdAt: new Date().toISOString(),
  }));

  const handleNotificationClick = (notification) => {
    // Handle notification click - navigate based on type
    if (notification.type === 'appointment') {
      router.push('/appointments');
    } else if (notification.type === 'invoice') {
      router.push('/invoices');
    } else if (notification.type === 'inventory') {
      router.push('/inventory');
    } else if (notification.type === 'lot') {
      router.push('/inventory/lots');
    }
  };

  const handleMarkAsRead = (_id) => {
    // Mark individual notification as read
  };

  const handleMarkAllAsRead = () => {
    // Mark all notifications as read
  };

  const showStaleBanner =
    !isDoctor && clinicListsSWR.error && clinicListsSWR.todayAppointments?.length > 0;

  return (
    <Layout>
      <ProfilerWrapper id='dashboard'>
        {showStaleBanner && (
          <StaleDataBanner visible onRetry={() => clinicListsSWR.fetchDashboardLists()} />
        )}
        {!isDoctor && (
          <UpdatesAvailableBanner
            visible={updatesAvailable}
            onRefresh={() => startTransition(applyUpdates)}
          />
        )}
        <div className='dashboard-container'>
          {/* Page Header – doctor: welcome banner; clinic: overview */}
          <PageHeader
            title={
              isDoctor && user?.firstName
                ? t('dashboard.welcomeBackDoctor').replace('{{name}}', user.firstName)
                : t('dashboard.overview')
            }
            subtitle={formatDateDisplay()}
            notifications={notifications}
            unreadCount={criticalAlerts.length}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            actionButton={<QuickActions onNavigate={(path) => router.push(path)} loading={false} />}
          />

          {/* Critical Alerts / Pending Tasks (Quick Actions moved to header bar) */}
          <div className='dashboard-section'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3'>
              {/* Critical Alerts - Only for non-doctors */}
              {!isDoctor && criticalAlerts && criticalAlerts.length > 0 && (
                <div className='lg:col-span-2'>
                  <ErrorBoundary>
                    <Suspense fallback={<div className='skeleton skeleton-card h-24' />}>
                      <CriticalAlerts
                        alerts={criticalAlerts}
                        onViewAll={(alert) => {
                          if (alert?.type === 'inventory') router.push('/inventory');
                          else if (alert?.type === 'appointments') router.push('/appointments');
                          else router.push('/reports');
                        }}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              )}
              {/* Doctor-specific: Pending Tasks Card */}
              {isDoctor && (
                <div className='lg:col-span-2'>
                  <Card className='p-6 h-full'>
                    <div className='flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200'>
                      <div className='flex items-center gap-3'>
                        <div className='w-3 h-3 bg-warning-500 rounded-full'></div>
                        <h3 className='text-lg font-bold text-neutral-900'>
                          {t('dashboard.pendingTasks')}
                        </h3>
                      </div>
                      <button
                        type='button'
                        onClick={() => router.push('/doctors/reviews')}
                        className='text-sm font-medium text-primary-600 hover:text-primary-700'
                      >
                        {t('dashboard.seeAll')}
                      </button>
                    </div>
                    <div className='space-y-3'>
                      {stats?.pendingReviews > 0 && (
                        <div
                          className='p-3 bg-warning-50 border border-warning-200 rounded-lg cursor-pointer hover:bg-warning-100 transition-colors'
                          onClick={() => router.push('/doctors/reviews')}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-warning-900'>
                              {stats.pendingReviews} {t('dashboard.reviewsPending')}
                            </span>
                            <span className='text-warning-600'>→</span>
                          </div>
                        </div>
                      )}
                      {stats?.patientsWaiting > 0 && (
                        <div
                          className='p-3 bg-primary-50 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors'
                          onClick={() => router.push('/appointments?status=in_queue,arrived')}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-primary-900'>
                              {stats.patientsWaiting} {t('dashboard.patientsWaiting')}
                            </span>
                            <span className='text-primary-600'>→</span>
                          </div>
                        </div>
                      )}
                      {(stats?.labReportsToReview ?? 0) > 0 && (
                        <div
                          className='p-3 bg-primary-50 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors'
                          onClick={() => router.push('/reports')}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-primary-900'>
                              {stats.labReportsToReview} {t('dashboard.labReportsToReview')}
                            </span>
                            <span className='text-primary-600'>→</span>
                          </div>
                        </div>
                      )}
                      {(stats?.newMessages ?? 0) > 0 && (
                        <div
                          className='p-3 bg-primary-50 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors'
                          onClick={() => router.push('/doctors/messages')}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-primary-900'>
                              {stats.newMessages} {t('dashboard.newMessages')}
                            </span>
                            <span className='text-primary-600'>→</span>
                          </div>
                        </div>
                      )}
                      {(stats?.prescriptionsToApprove ?? 0) > 0 && (
                        <div
                          className='p-3 bg-primary-50 border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors'
                          onClick={() => router.push('/prescriptions?status=draft')}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-primary-900'>
                              {stats.prescriptionsToApprove} {t('dashboard.prescriptionsToApprove')}
                            </span>
                            <span className='text-primary-600'>→</span>
                          </div>
                        </div>
                      )}
                      {(!stats?.pendingReviews || stats.pendingReviews === 0) &&
                        (!stats?.patientsWaiting || stats.patientsWaiting === 0) &&
                        (stats?.labReportsToReview ?? 0) === 0 &&
                        (stats?.newMessages ?? 0) === 0 &&
                        (stats?.prescriptionsToApprove ?? 0) === 0 && (
                          <p className='text-sm text-neutral-500 text-center py-4'>
                            {t('dashboard.noPendingTasks')}
                          </p>
                        )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Key Statistics Cards - Doctor: 8 KPIs; General: 4 */}
          <div className='dashboard-section'>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${isDoctor ? 'lg:grid-cols-4 xl:grid-cols-8' : 'lg:grid-cols-4'} gap-3`}
            >
              {isDoctor ? (
                <>
                  <StatsCard
                    title={t('dashboard.todayAppointmentsLabel')}
                    value={stats?.todayAppointments || 0}
                    trend={stats?.appointmentsTrend}
                    icon='calendar'
                    colorScheme='primary'
                    onClick={() => router.push('/appointments')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.thisWeekAppointments')}
                    value={stats?.thisWeekAppointments ?? 0}
                    trend={null}
                    icon='calendar'
                    colorScheme='primary'
                    onClick={() => router.push('/appointments')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.thisMonthAppointments')}
                    value={stats?.thisMonthAppointments ?? 0}
                    trend={null}
                    icon='calendar'
                    colorScheme='primary'
                    onClick={() => router.push('/appointments')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.totalPatients')}
                    value={stats?.totalPatients || 0}
                    trend={stats?.patientsTrend}
                    icon='patients'
                    colorScheme='primary'
                    onClick={() => router.push('/patients')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.queueCount')}
                    value={stats?.patientsWaiting || 0}
                    trend={null}
                    icon='queue'
                    colorScheme='warning'
                    onClick={() => router.push('/appointments?status=in_queue,arrived')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.revenueThisMonth')}
                    value={formatCurrency(stats?.revenue || 0)}
                    trend={stats?.revenueTrend}
                    icon='currency-dollar'
                    colorScheme='primary'
                    onClick={() => router.push('/doctors/earnings')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.videoCallsThisMonth')}
                    value={stats?.videoCallsThisMonth ?? 0}
                    trend={null}
                    icon='video'
                    colorScheme='primary'
                    onClick={() => router.push('/telemedicine')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.averageRating')}
                    value={
                      stats?.averageRating != null ? Number(stats.averageRating).toFixed(1) : '—'
                    }
                    trend={null}
                    icon='star'
                    colorScheme='success'
                    onClick={() => router.push('/doctors/reviews')}
                    loading={statsLoading}
                  />
                </>
              ) : (
                <>
                  <StatsCard
                    title={t('dashboard.totalPatients')}
                    value={stats?.activePatients || 0}
                    trend={stats?.patientsTrend}
                    icon='patients'
                    colorScheme='primary'
                    onClick={() => router.push('/patients')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.todayAppointmentsLabel')}
                    value={stats?.todayAppointments || 0}
                    trend={stats?.appointmentsTrend}
                    icon='calendar'
                    colorScheme='primary'
                    onClick={() => router.push('/appointments')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.todayRevenue')}
                    value={formatCurrency(stats?.todayRevenue || 0)}
                    trend={stats?.revenueTrend}
                    icon='currency-dollar'
                    colorScheme='success'
                    onClick={() => router.push('/invoices')}
                    loading={statsLoading}
                  />
                  <StatsCard
                    title={t('dashboard.pendingInvoices')}
                    value={stats?.pendingInvoices ?? 0}
                    trend={stats?.invoicesTrend}
                    icon='document-text'
                    colorScheme='warning'
                    onClick={() => router.push('/invoices?status=pending')}
                    loading={statsLoading}
                  />
                </>
              )}
            </div>
          </div>

          {/* Main Content – Today's Appointments & Appointment Request side by side, then 3-col grid */}
          {!isDoctor && (
            <div className='dashboard-section'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch'>
                <div className='dashboard-card-cell'>
                  <DashboardListCard
                    title={t('dashboard.todayAppointments')}
                    data={todayAppointments}
                    loading={listsLoading}
                    colorScheme='primary'
                    emptyMessage={t('dashboard.emptyToday')}
                    showSeeAll={true}
                    onSeeAll={() => router.push('/appointments')}
                    renderItem={(appointment) => (
                      <AppointmentListItem
                        key={appointment._id || appointment.id}
                        appointment={appointment}
                        onClick={() =>
                          router.push(`/appointments/${appointment._id || appointment.id}`)
                        }
                      />
                    )}
                  />
                </div>
                <div className='dashboard-card-cell'>
                  <AppointmentRequestCard
                    requests={appointmentRequests}
                    loading={listsLoading}
                    onAccept={(request) => {
                      router.push(
                        `/appointments/${request._id || request.id}/edit?status=confirmed`
                      );
                    }}
                    onDecline={(request) => {
                      router.push(
                        `/appointments/${request._id || request.id}/edit?status=cancelled`
                      );
                    }}
                    onMessage={(request) => {
                      if (request._id) {
                        router.push(`/telemedicine/${request._id}`);
                      }
                    }}
                    onSeeAll={() => router.push('/appointments?status=pending')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content – 3 cards per row: Summary, Next Patient, Patients Review, Calendar */}
          <div className='dashboard-section'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch'>
              {!isDoctor && (
                <>
                  <div className='dashboard-card-cell'>
                    <PatientsSummaryChart
                      data={
                        stats?.patientsSummary || {
                          newPatients: stats?.newPatientsThisMonth || 0,
                          oldPatients: Math.max(
                            0,
                            (stats?.activePatients || 0) - (stats?.newPatientsThisMonth || 0)
                          ),
                          totalPatients: stats?.activePatients || 0,
                        }
                      }
                      loading={statsLoading}
                    />
                  </div>
                  {todayAppointments && todayAppointments.length > 0 ? (
                    <div className='dashboard-card-cell'>
                      <NextPatientCard
                        appointment={todayAppointments[0]}
                        patient={todayAppointments[0]?.patientId}
                        onCall={() => {
                          const phone = todayAppointments[0]?.patientId?.phone;
                          if (phone) window.location.href = `tel:${phone}`;
                        }}
                        onViewDetails={() => {
                          if (todayAppointments[0]?.patientId?._id) {
                            router.push(`/patients/${todayAppointments[0].patientId._id}`);
                          }
                        }}
                        onChat={() => {
                          if (todayAppointments[0]?._id) {
                            router.push(`/telemedicine/${todayAppointments[0]._id}`);
                          }
                        }}
                        onStartVideo={handleStartVideo}
                      />
                    </div>
                  ) : null}
                  <div className='dashboard-card-cell'>
                    <PatientsReviewCard loading={statsLoading} />
                  </div>
                  <div className='dashboard-card-cell'>
                    <ErrorBoundary>
                      <Suspense
                        fallback={<div className='skeleton skeleton-card h-full min-h-[200px]' />}
                      >
                        <CalendarWidget
                          loading={listsLoading}
                          onDateSelect={(date) => {
                            router.push(`/appointments?date=${date.toISOString().split('T')[0]}`);
                          }}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </>
              )}

              {/* Doctor: order by importance – Today’s Schedule, Next Patient, Earnings, Quick Stats, Upcoming, Pending Reviews, New Requests, Calendar, Recent Patients, Patient Feedback */}
              {isDoctor && (
                <>
                  <div className='dashboard-card-cell'>
                    <DashboardListCard
                      title={t('dashboard.todayAppointments')}
                      data={todayAppointments}
                      loading={listsLoading}
                      colorScheme='primary'
                      emptyMessage={t('dashboard.emptyToday')}
                      showSeeAll={true}
                      onSeeAll={() => router.push('/appointments')}
                      renderItem={(appointment) => {
                        const start = new Date(
                          appointment.schedule?.startTime ||
                            appointment.startTime ||
                            appointment.appointmentDate
                        );
                        const end = new Date(
                          appointment.schedule?.endTime ||
                            appointment.endTime ||
                            appointment.appointmentDate
                        );
                        const now = Date.now();
                        const isCurrentSlot =
                          appointment.status === 'in_progress' ||
                          (now >= start.getTime() && now <= end.getTime());
                        const patientId = appointment.patientId?._id || appointment.patientId;
                        return (
                          <AppointmentListItem
                            key={appointment._id || appointment.id}
                            appointment={appointment}
                            isCurrent={isCurrentSlot}
                            onClick={() =>
                              router.push(`/appointments/${appointment._id || appointment.id}`)
                            }
                            onViewHistory={
                              patientId
                                ? () => router.push(`/doctors/patients/${patientId}`)
                                : undefined
                            }
                            onStart={handleStartVideo}
                            onReschedule={() =>
                              router.push(
                                `/appointments/${appointment._id || appointment.id}?reschedule=1`
                              )
                            }
                            onCancel={() =>
                              router.push(
                                `/appointments/${appointment._id || appointment.id}?cancel=1`
                              )
                            }
                          />
                        );
                      }}
                    />
                  </div>
                  {todayAppointments && todayAppointments.length > 0 && (
                    <div className='dashboard-card-cell'>
                      <NextPatientCard
                        appointment={todayAppointments[0]}
                        patient={todayAppointments[0]?.patientId}
                        onCall={() => {
                          const phone = todayAppointments[0]?.patientId?.phone;
                          if (phone) window.location.href = `tel:${phone}`;
                        }}
                        onViewDetails={() => {
                          if (todayAppointments[0]?.patientId?._id) {
                            router.push(`/patients/${todayAppointments[0].patientId._id}`);
                          }
                        }}
                        onChat={() => {
                          if (todayAppointments[0]?._id) {
                            router.push(`/telemedicine/${todayAppointments[0]._id}`);
                          }
                        }}
                        onStartVideo={handleStartVideo}
                      />
                    </div>
                  )}
                  <div className='dashboard-card-cell'>
                    <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
                      <div className='text-center'>
                        <h3 className='text-sm font-medium text-neutral-600 mb-2'>
                          {t('doctors.earningsToday')}
                        </h3>
                        <p className='text-3xl font-bold text-primary-600 mb-1'>
                          {formatCurrency(stats?.earningsToday || 0)}
                        </p>
                        <p className='text-xs text-neutral-500'>
                          {stats?.completedConsultations || 0} {t('doctors.consultations')}
                        </p>
                      </div>
                    </Card>
                  </div>
                  <div className='dashboard-card-cell'>
                    <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                      <h3 className='text-sm font-medium text-neutral-600 mb-4'>
                        {t('doctors.quickStats')}
                      </h3>
                      <div className='space-y-3'>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-neutral-600'>{t('doctors.avgRating')}</span>
                          <span className='text-lg font-bold text-neutral-900'>
                            {stats?.averageRating || 'N/A'}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-neutral-600'>
                            {t('dashboard.totalReviews')}
                          </span>
                          <span className='text-lg font-bold text-neutral-900'>
                            {stats?.totalReviews || 0}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-neutral-600'>
                            {t('doctors.responseRate')}
                          </span>
                          <span className='text-lg font-bold text-neutral-900'>
                            {stats?.responseRate || 0}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className='dashboard-card-cell'>
                    <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                      <h3 className='text-sm font-medium text-neutral-600 mb-4'>
                        {t('dashboard.recentActivity')}
                      </h3>
                      {statsLoading ? (
                        <div className='space-y-2'>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className='skeleton skeleton-text w-full h-8' />
                          ))}
                        </div>
                      ) : (stats?.recentActivity?.length ?? 0) > 0 ? (
                        <ul className='space-y-2'>
                          {stats.recentActivity.map((item) => (
                            <li
                              key={item._id}
                              className='text-body-xs text-neutral-700 flex justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0 last:pb-0'
                            >
                              <span className='truncate'>{item.label}</span>
                              <span className='text-neutral-500 flex-shrink-0'>
                                {item.timestamp
                                  ? new Date(item.timestamp).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className='text-sm text-neutral-500 text-center py-4'>
                          {t('dashboard.noRecentActivity')}
                        </p>
                      )}
                    </Card>
                  </div>

                  {upcomingAppointments && upcomingAppointments.length > 0 && (
                    <div className='dashboard-card-cell'>
                      <DashboardListCard
                        title={t('doctors.upcomingAppointments')}
                        data={upcomingAppointments}
                        loading={listsLoading}
                        colorScheme='primary'
                        emptyMessage={t('doctors.noUpcomingAppointments')}
                        showSeeAll={true}
                        onSeeAll={() => router.push('/appointments')}
                        renderItem={(appointment) => (
                          <AppointmentListItem
                            key={appointment._id || appointment.id}
                            appointment={appointment}
                            onClick={() =>
                              router.push(`/appointments/${appointment._id || appointment.id}`)
                            }
                          />
                        )}
                      />
                    </div>
                  )}

                  {pendingReviews && pendingReviews.length > 0 && (
                    <div className='dashboard-card-cell'>
                      <DashboardListCard
                        title={t('dashboard.pendingReviews')}
                        data={pendingReviews}
                        loading={listsLoading}
                        colorScheme='warning'
                        emptyMessage={t('doctors.noPendingReviews')}
                        showSeeAll={true}
                        onSeeAll={() =>
                          router.push('/appointments?status=completed&hasClinicalNote=false')
                        }
                        renderItem={(appointment) => (
                          <AppointmentListItem
                            key={appointment._id || appointment.id}
                            appointment={appointment}
                            onClick={() =>
                              router.push(`/appointments/${appointment._id || appointment.id}`)
                            }
                          />
                        )}
                      />
                    </div>
                  )}

                  {newPatientRequests && newPatientRequests.length > 0 && (
                    <div className='dashboard-card-cell'>
                      <DashboardListCard
                        title={t('doctors.newPatientRequests')}
                        data={newPatientRequests.slice(0, 5)}
                        loading={listsLoading}
                        colorScheme='primary'
                        emptyMessage={t('doctors.noNewPatientRequests')}
                        showSeeAll={true}
                        onSeeAll={() => router.push('/appointments?status=pending')}
                        renderItem={(request) => (
                          <div
                            key={request._id || request.id}
                            className='p-3 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors'
                            onClick={() =>
                              router.push(`/appointments/${request._id || request.id}`)
                            }
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <p className='font-semibold text-neutral-900 dark:text-neutral-100'>
                                  {request.patientId?.firstName} {request.patientId?.lastName}
                                </p>
                                <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                                  {new Date(
                                    request.appointmentDate || request.startTime
                                  ).toLocaleDateString()}{' '}
                                  at{' '}
                                  {new Date(request.startTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {request.reason && (
                                  <p className='text-xs text-neutral-500 mt-1'>{request.reason}</p>
                                )}
                              </div>
                              <div className='flex gap-2 ml-4'>
                                <Button
                                  variant='primary'
                                  size='sm'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/appointments/${request._id || request.id}/edit?status=confirmed`
                                    );
                                  }}
                                >
                                  {t('common.accept')}
                                </Button>
                                <Button
                                  variant='secondary'
                                  size='sm'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/appointments/${request._id || request.id}/edit?status=cancelled`
                                    );
                                  }}
                                >
                                  {t('common.decline')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* removed duplicate AppointmentRequest - non-doctor only */}
                  {false && false && (
                    <div className='flex-1'>
                      <AppointmentRequestCard
                        requests={appointmentRequests}
                        loading={listsLoading}
                        onAccept={(request) => {
                          // Handle accept appointment
                          router.push(
                            `/appointments/${request._id || request.id}/edit?status=confirmed`
                          );
                        }}
                        onDecline={(request) => {
                          // Handle decline appointment
                          router.push(
                            `/appointments/${request._id || request.id}/edit?status=cancelled`
                          );
                        }}
                        onMessage={(request) => {
                          // Handle message
                          if (request._id) {
                            router.push(`/telemedicine/${request._id}`);
                          }
                        }}
                      />
                    </div>
                  )}

                  {recentPatients && recentPatients.length > 0 && (
                    <div className='dashboard-card-cell'>
                      <DashboardListCard
                        title={t('dashboard.recentPatients')}
                        data={recentPatients.slice(0, 5)}
                        loading={listsLoading}
                        colorScheme='primary'
                        emptyMessage={t('dashboard.emptyRecent')}
                        showSeeAll={true}
                        onSeeAll={() => router.push('/patients')}
                        renderItem={(patient) => (
                          <PatientListItem
                            key={patient._id || patient.id}
                            patient={patient}
                            onClick={() => router.push(`/patients/${patient._id || patient.id}`)}
                          />
                        )}
                      />
                    </div>
                  )}

                  <div className='dashboard-card-cell'>
                    <ErrorBoundary>
                      <Suspense
                        fallback={<div className='skeleton skeleton-card h-full min-h-[200px]' />}
                      >
                        <CalendarWidget
                          loading={listsLoading}
                          onDateSelect={(date) => {
                            router.push(`/appointments?date=${date.toISOString().split('T')[0]}`);
                          }}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  </div>

                  {stats?.totalReviews > 0 && (
                    <div className='dashboard-card-cell'>
                      <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-lg font-bold text-neutral-900'>
                            {t('dashboard.patientFeedback')}
                          </h3>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push('/doctors/reviews')}
                          >
                            {t('common.viewAll')}
                          </Button>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-neutral-600'>
                              {t('dashboard.averageRating')}
                            </span>
                            <div className='flex items-center gap-2'>
                              <span className='text-2xl font-bold text-neutral-900'>
                                {stats.averageRating.toFixed(1)}
                              </span>
                              <div className='flex'>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    className={`icon icon-sm ${
                                      star <= Math.round(stats.averageRating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-neutral-300'
                                    }`}
                                    fill={
                                      star <= Math.round(stats.averageRating)
                                        ? 'currentColor'
                                        : 'none'
                                    }
                                    ariaHidden
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-neutral-600'>
                              {t('dashboard.totalReviews')}
                            </span>
                            <span className='font-semibold text-neutral-900'>
                              {stats.totalReviews}
                            </span>
                          </div>
                          {stats.pendingReviews > 0 && (
                            <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                              <p className='text-sm text-yellow-800'>
                                {stats.pendingReviews} appointment
                                {stats.pendingReviews > 1 ? 's' : ''} {t('dashboard.needReview')}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Charts Section - Only for non-doctors */}
          {!isDoctor && (
            <div className='dashboard-section'>
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-3'>
                      <div className='skeleton skeleton-chart h-64' />
                      <div className='skeleton skeleton-chart h-64' />
                      <div className='skeleton skeleton-chart h-64' />
                    </div>
                  }
                >
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch'>
                    <ChartCard
                      title={t('dashboard.revenueTrend14')}
                      data={chartData.revenue}
                      colorScheme='primary'
                      loading={chartsLoading}
                    />
                    <ChartCard
                      title={t('dashboard.appointmentTrend14')}
                      data={chartData.appointments}
                      colorScheme='primary'
                      loading={chartsLoading}
                    />
                    <ChartCard
                      title={t('dashboard.newPatients14')}
                      data={chartData.patients}
                      colorScheme='warning'
                      loading={chartsLoading}
                    />
                  </div>
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* Critical Lists - 2 columns - Only for non-doctors */}
          {!isDoctor && (
            <div className='dashboard-section'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch'>
                {/* Overdue Invoices */}
                <DashboardListCard
                  title={t('dashboard.overdueInvoices')}
                  data={overdueInvoices}
                  loading={listsLoading}
                  colorScheme='warning'
                  emptyMessage={t('dashboard.emptyOverdue')}
                  renderItem={(invoice) => (
                    <InvoiceListItem
                      key={invoice._id || invoice.id}
                      invoice={invoice}
                      onClick={() => router.push(`/invoices/${invoice._id || invoice.id}`)}
                      formatCurrency={formatCurrency}
                    />
                  )}
                />

                {/* Low Stock Items */}
                <DashboardListCard
                  title={t('dashboard.lowStockItems')}
                  data={lowStockList}
                  loading={listsLoading}
                  colorScheme='error'
                  emptyMessage={t('dashboard.emptyLowStock')}
                  renderItem={(item) => (
                    <InventoryListItem
                      key={item._id || item.id}
                      item={item}
                      onClick={() => router.push(`/inventory/items/${item._id || item.id}`)}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </ProfilerWrapper>
    </Layout>
  );
}
