'use client';

import { CheckIcon, ChevronRightIcon, RefreshCwIcon, StarIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfilerWrapper } from '@/components/ProfilerWrapper';
import { StaleDataBanner } from '@/components/StaleDataBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { useUpdatesAvailable } from '@/hooks/useUpdatesAvailable';
import { apiClient } from '@/lib/api/client';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess, showWarning } from '@/lib/utils/toast';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

// Dashboard components – critical path
import { AppointmentListItem } from './components/AppointmentListItem';
import { DashboardListCard } from './components/DashboardListCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { InventoryListItem } from './components/InventoryListItem';
import { InvoiceListItem } from './components/InvoiceListItem';
import { NextPatientCard } from './components/NextPatientCard';
import { PatientListItem } from './components/PatientListItem';
import { PatientsReviewCard } from './components/PatientsReviewCard';
import { PatientsSummaryChart } from './components/PatientsSummaryChart';
import { QuickActions } from './components/QuickActions';
import { StatsCard } from './components/StatsCard';

// Code splitting: dynamic load heavy dashboard sections with skeleton fallbacks
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CalendarSkeleton, CardSkeleton, ChartSkeleton } from '@/components/skeletons';

const ChartCard = nextDynamic(
  () =>
    import('./components/ChartCard')
      .then((m) => ({ default: m.ChartCard }))
      .catch(() => ({ default: () => <ChartSkeleton variant='line' /> })),
  { loading: () => <ChartSkeleton variant='line' />, ssr: false },
);
const CalendarWidget = nextDynamic(
  () =>
    import('./components/CalendarWidget')
      .then((m) => ({ default: m.CalendarWidget }))
      .catch(() => ({ default: () => <CalendarSkeleton /> })),
  { loading: () => <CalendarSkeleton />, ssr: false },
);
const CriticalAlerts = nextDynamic(
  () =>
    import('./components/CriticalAlerts')
      .then((m) => ({ default: m.CriticalAlerts }))
      .catch(() => ({ default: () => <CardSkeleton count={2} /> })),
  { loading: () => <CardSkeleton count={2} />, ssr: false },
);

// Clinic: single useDashboard() → /api/dashboard/all. Doctor: useDoctorDashboardStats/Lists.
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { canViewRevenueReports } from '@/lib/permissions/cursor-md-matrix';
import { TabBar } from './_components/TabBar';
import { TabContent } from './_components/TabContent';
import { AppointmentsTab } from './_tabs/AppointmentsTab';
import { KPIDashboardTab } from './_tabs/KPIDashboardTab';
import { OverviewTab } from './_tabs/OverviewTab';
import { PrescriptionsTab } from './_tabs/PrescriptionsTab';
import { AppointmentsListWithHook } from './components/AppointmentsList';
import { useDashboard } from './hooks/useDashboard';
import { useDoctorDashboardLists } from './hooks/useDoctorDashboardLists';
import { useDoctorDashboardStats } from './hooks/useDoctorDashboardStats';
import {
  ActionsSection,
  AlertsSection,
  KPISection,
  TablesSection,
  TrendsSection,
} from './sections';

/* Dashboard styles loaded by app/dashboard/layout.jsx for reliable load on client nav */

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const { open: openConfirm } = useConfirmation();
  const tenantId = user?.tenantId ?? null;

  // Tab state: ?tab=overview|kpi|appointments|prescriptions; no redirect. TabBar + TabContent render in-page.
  // Use local state for instant switching, sync with URL
  const urlTab = searchParams?.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(
    urlTab === 'overview' ||
      urlTab === 'kpi' ||
      urlTab === 'appointments' ||
      urlTab === 'prescriptions'
      ? urlTab
      : 'overview',
  );

  // Sync local state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const normalizedUrlTab =
      urlTab === 'overview' ||
      urlTab === 'kpi' ||
      urlTab === 'appointments' ||
      urlTab === 'prescriptions'
        ? urlTab
        : 'overview';
    if (normalizedUrlTab !== activeTab) {
      setActiveTab(normalizedUrlTab);
    }
  }, [urlTab]);

  // Measure tab switch time (target <200ms; warn if >500ms)
  useEffect(() => {
    if (typeof performance === 'undefined' || !performance.getEntriesByName) return;
    const marks = performance.getEntriesByName('dashboard-tab-switch-start');
    if (marks.length === 0) return;
    try {
      performance.measure('dashboard-tab-switch', 'dashboard-tab-switch-start');
      const measures = performance.getEntriesByName('dashboard-tab-switch');
      const last = measures[measures.length - 1];
      if (last?.duration != null) {
        const duration = Math.round(last.duration);
        if (duration > 500) {
          logger.warn(`[Dashboard] Slow tab switch: ${duration}ms (target <200ms)`);
        }
      }
    } finally {
      performance.clearMarks('dashboard-tab-switch-start');
      performance.clearMeasures('dashboard-tab-switch');
    }
  }, [activeTab]);

  // Check if user is a doctor – clinic SWR hooks get null so they don't fetch (saves 13 API calls)
  const isDoctor = user?.role === 'doctor';
  const clinicTenantId = isDoctor ? null : tenantId;

  // Defer charts so stats + lists paint first (faster first paint)
  const [chartsEnabled, setChartsEnabled] = useState(false);
  // Avoid hydration mismatch: server and client must render same shell (no <a> in main until mounted)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartVideo = useCallback(
    async (appointment) => {
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
            showError(response.error?.message || t('errors.failedToCreateVideoSession'));
            return;
          }
        }
        if (sessionId) {
          window.open(`/telemedicine/${sessionId}?role=doctor`, '_blank');
        } else {
          showError(t('errors.unableToStartVideoSession'));
        }
      } catch (error) {
        showError(error.message || t('errors.failedToStartVideoSession'));
      }
    },
    [t],
  );

  // Clinic: one request to /api/dashboard/all (stats + lists + charts). Doctor: separate hooks.
  const dashboardAll = useDashboard({ enabled: !isDoctor });
  const doctorStats = useDoctorDashboardStats();
  const doctorLists = useDoctorDashboardLists();

  const stats = isDoctor ? doctorStats.stats : dashboardAll.stats;
  const statsLoading = isDoctor ? doctorStats.loading : dashboardAll.loading;
  const fetchStatsBackground = isDoctor ? doctorStats.fetchStats : dashboardAll.refresh;
  const forceRefresh = isDoctor ? doctorStats.fetchStats : dashboardAll.refresh;

  const chartData = isDoctor
    ? { revenue: [], appointments: [], patients: [] }
    : (dashboardAll.chartData ?? { revenue: [], appointments: [], patients: [] });
  const chartsLoading = isDoctor ? false : dashboardAll.chartsLoading;
  const fetchChartData = isDoctor ? () => Promise.resolve() : dashboardAll.refresh;

  const generalLists = isDoctor ? doctorLists : dashboardAll;
  const { updatesAvailable, applyUpdates } = useUpdatesAvailable(
    isDoctor ? doctorLists : dashboardAll,
    isDoctor ? doctorLists.loading : dashboardAll.isRefreshing,
    isDoctor ? doctorLists.fetchDashboardLists : dashboardAll.refresh,
  );
  const [isPending, startTransition] = useTransition();
  const { prefetchAppointment, prefetchPatient } = usePrefetchDetail();
  // Non-blocking navigation so clicks stay responsive
  const navigate = useCallback((path) => startTransition(() => router.push(path)), [router]);

  const handleManualRefresh = useCallback(() => {
    startTransition(() => {
      if (isDoctor) {
        doctorStats.fetchStats();
        doctorLists.fetchDashboardLists();
      } else {
        dashboardAll.refresh();
      }
    });
  }, [isDoctor, startTransition, doctorStats, doctorLists, dashboardAll]);

  // Use doctor-specific lists if doctor, otherwise SWR lists (AppointmentsListWithHook in the
  // Today's Schedule card handles its own incremental fetching for the live list display).
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
  const consecutiveFailsRef = useRef(0);
  const lastRefreshAtRef = useRef(0);
  const MIN_REFRESH_INTERVAL_MS = 10000; // 10s min between background refreshes
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  useEffect(() => {
    // Yield one render frame so stats/lists paint first, then start chart fetch immediately
    const id = requestAnimationFrame(() => setChartsEnabled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Mark initial load done once stats + lists have loaded (so auto-refresh interval can start)
  useEffect(() => {
    if (user && !authLoading && user.role !== 'super_admin' && !statsLoading && !listsLoading) {
      setInitialLoadDone(true);
      hasFetchedRef.current = true;
    }
  }, [user, authLoading, statsLoading, listsLoading]);

  // Auto-refresh (silent, no flicker) – start only after initial load
  useEffect(() => {
    if (authLoading || !user || user.role === 'super_admin' || !initialLoadDone) return;

    const onRefreshFail = () => {
      consecutiveFailsRef.current += 1;
      if (consecutiveFailsRef.current === 3) {
        showWarning(t('dashboard.refreshFailed') || 'Data may be outdated. Check your connection.');
        consecutiveFailsRef.current = 0;
      }
    };
    const onRefreshOk = () => {
      consecutiveFailsRef.current = 0;
    };

    const runRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < MIN_REFRESH_INTERVAL_MS) return;
      lastRefreshAtRef.current = now;
      fetchStatsBackground().then(onRefreshOk).catch(onRefreshFail);
      fetchDashboardLists().then(onRefreshOk).catch(onRefreshFail);
      if (!isDoctor) fetchChartData().catch(() => {});
    };

    refreshIntervalRef.current = setInterval(runRefresh, DASHBOARD_AUTO_REFRESH_MS);

    const handleVisibility = () => {
      if (document.hidden) {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        if (!refreshIntervalRef.current) {
          runRefresh();
          refreshIntervalRef.current = setInterval(runRefresh, DASHBOARD_AUTO_REFRESH_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const handleFocus = () => {
      fetchStatsBackground().then(onRefreshOk).catch(onRefreshFail);
      fetchDashboardLists().then(onRefreshOk).catch(onRefreshFail);
      if (!isDoctor) fetchChartData().catch(() => {});
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [
    authLoading,
    user,
    initialLoadDone,
    isDoctor,
    fetchStatsBackground,
    fetchDashboardLists,
    fetchChartData,
  ]);

  // Redirect when no user or super_admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const timer = setTimeout(() => navigate('/login'), 100);
      return () => clearTimeout(timer);
    }
    if (user.role === 'super_admin') {
      navigate('/admin');
      return;
    }
  }, [authLoading, user, navigate]);

  // Utility functions - memoized to prevent recreation on every render
  const formatCurrency = useCallback(
    (amount) => {
      return formatCurrencyUtil(amount, currency, locale);
    },
    [currency, locale],
  );

  const formatDateDisplay = useCallback(() => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [locale]);

  // Memoize tab content – pass isActive so tabs revalidate when switched to
  const appointmentsContent = useMemo(
    () => <AppointmentsTab isActive={activeTab === 'appointments'} />,
    [activeTab],
  );
  const prescriptionsContent = useMemo(
    () => <PrescriptionsTab isActive={activeTab === 'prescriptions'} />,
    [activeTab],
  );
  const kpiContent = useMemo(() => <KPIDashboardTab isActive={activeTab === 'kpi'} />, [activeTab]);

  // Prepare notifications for PageHeader - memoized to prevent recreation on every render
  // Must be called unconditionally (before any early returns) to follow Rules of Hooks
  const notifications = useMemo(
    () =>
      criticalAlerts.map((alert, index) => ({
        id: `alert-${index}`,
        type: alert.type || 'system',
        title: alert.message || t('common.alert'),
        message: alert.message || '',
        unread: true,
        createdAt: new Date().toISOString(),
      })),
    [criticalAlerts, t],
  );

  // QuickActions moved to tab row (right corner)

  // Notification handlers – must be declared before any early return (Rules of Hooks)
  const handleNotificationClick = useCallback(
    (notification) => {
      if (notification.type === 'appointment') {
        navigate('/appointments');
      } else if (notification.type === 'invoice') {
        navigate('/invoices');
      } else if (notification.type === 'inventory') {
        navigate('/inventory');
      } else if (notification.type === 'lot') {
        navigate('/inventory/lots');
      }
    },
    [navigate],
  );
  const handleMarkAsRead = useCallback((_id) => {
    // Mark individual notification as read
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    openConfirm({
      title: t('notifications.markAllReadTitle') || 'Mark all as read?',
      message: t('notifications.markAllReadDesc') || 'All notifications will be marked as read.',
      variant: 'info',
      confirmLabel: t('common.markAllRead') || 'Mark all read',
      onConfirm: async () => {
        // Future: await apiClient.post('/notifications/mark-all-read');
        showSuccess(t('notifications.allMarkedRead') || 'All notifications marked as read.');
      },
    });
  }, [openConfirm, t]);

  // Loading states – show dashboard skeleton (layout-shaped placeholders) instead of logo+bar loader
  // Server and client must match: render same shell until mounted to avoid hydration (e.g. <a> in <div> mismatch)
  if (!mounted) {
    return (
      <Layout>
        <div className='dashboard-container'>
          <div className='dashboard-header-block'>
            <PageHeader
              title={t('dashboard.overview')}
              subtitle={formatDateDisplay()}
              notifications={[]}
              unreadCount={0}
              variant='dashboard'
            />
          </div>
          <DashboardSkeleton isDoctor={false} />
        </div>
      </Layout>
    );
  }
  if (authLoading) {
    return (
      <Layout>
        <div className='dashboard-container'>
          <div className='dashboard-header-block'>
            <PageHeader
              title={t('dashboard.overview')}
              subtitle={formatDateDisplay()}
              notifications={[]}
              unreadCount={0}
              variant='dashboard'
            />
          </div>
          <DashboardSkeleton isDoctor={false} />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className='dashboard-container'>
          <div className='dashboard-header-block'>
            <PageHeader
              title={t('dashboard.overview')}
              subtitle={formatDateDisplay()}
              notifications={[]}
              unreadCount={0}
              variant='dashboard'
            />
          </div>
          <div className='dashboard-skeleton-root flex items-center justify-center min-h-[300px]' role='status' aria-label={t('auth.redirectingToLogin')}>
            <Loader type='section' text={t('auth.redirectingToLogin')} />
          </div>
        </div>
      </Layout>
    );
  }

  const initialDashboardLoading = statsLoading || listsLoading;
  const showStaleBanner =
    !isDoctor && dashboardAll.error && dashboardAll.todayAppointments?.length > 0;

  return (
    <Layout>
      <ProfilerWrapper id='dashboard'>
        {showStaleBanner && (
          <StaleDataBanner
            visible
            onRetry={() => (isDoctor ? doctorLists.fetchDashboardLists() : dashboardAll.refresh())}
          />
        )}
        {!isDoctor && dashboardAll.isRefreshing && (
          <div
            className='fixed top-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-slate-800 shadow-lg rounded-full px-3 py-1.5 text-xs text-slate-500 border border-slate-100 dark:border-slate-700'
            role='status'
            aria-live='polite'
          >
            <RefreshCwIcon className='icon icon-xs animate-spin' aria-hidden />
            {t('dashboard.syncing') || 'Syncing...'}
          </div>
        )}
        <div className='dashboard-container'>
          {/* Unified header block – same design for Overview, Appointments, Prescriptions tabs */}
          <div className='dashboard-header-block'>
            <PageHeader
              title={
                isDoctor && user?.firstName && activeTab === 'overview'
                  ? t('dashboard.welcomeBackDoctor').replace('{{name}}', user.firstName)
                  : activeTab === 'overview'
                    ? t('dashboard.overview')
                    : activeTab === 'kpi'
                      ? t('dashboard.kpiDashboard')
                      : activeTab === 'appointments'
                        ? t('appointments.title')
                        : t('prescriptions.title')
              }
              subtitle={formatDateDisplay()}
              notifications={notifications}
              unreadCount={criticalAlerts.length}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onRefresh={handleManualRefresh || forceRefresh}
              refreshing={!isDoctor && dashboardAll.isRefreshing}
              variant='dashboard'
            />
            <div className='dashboard-header-divider' aria-hidden />
            <div
              className='dashboard-tab-row flex items-center justify-between gap-4'
              style={{
                /* Show tab row for doctors even while loading so KPI tab is visible; clinic can keep hiding until ready */
                display: isDoctor ? undefined : initialDashboardLoading ? 'none' : undefined,
              }}
            >
              <TabBar
                className='dashboard-tab-bar flex-1 min-w-0'
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userId={user?._id || user?.userId}
              />
              <div className='flex items-center shrink-0'>
                <QuickActions onNavigate={navigate} loading={false} userRole={user?.role} />
              </div>
            </div>
          </div>

          {/* Skeleton shown during initial load */}
          {initialDashboardLoading && <DashboardSkeleton isDoctor={isDoctor} />}

          <TabContent
            activeTab={activeTab}
            appointmentsContent={appointmentsContent}
            kpiContent={kpiContent}
            prescriptionsContent={prescriptionsContent}
            hidden={initialDashboardLoading}
          >
            <OverviewTab>
              {/* Critical Alerts / Pending Tasks – AlertsSection (STEP 5) */}
              <AlertsSection>
                <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid'>
                  {/* Critical Alerts - Only for non-doctors */}
                  {!isDoctor && criticalAlerts && criticalAlerts.length > 0 && (
                    <div className='lg:col-span-2'>
                      <ErrorBoundary>
                        <CriticalAlerts
                          alerts={criticalAlerts}
                          onViewAll={(alert) => {
                            if (alert?.type === 'inventory') navigate('/inventory');
                            else if (alert?.type === 'appointments') navigate('/appointments');
                            else navigate('/reports');
                          }}
                        />
                      </ErrorBoundary>
                    </div>
                  )}
                  {/* Doctor-specific: Pending Tasks Card */}
                  {isDoctor && (
                    <div className='lg:col-span-2'>
                      <Card className='p-6 h-full dashboard-pending-tasks-card'>
                        <div className='flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
                          <div className='flex items-center gap-3'>
                            <div className='dashboard-pending-tasks-dot' />
                            <h3 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                              {t('dashboard.pendingTasks')}
                            </h3>
                          </div>
                          <button
                            type='button'
                            onClick={() => navigate('/doctors/reviews')}
                            className='section-header-action inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors'
                          >
                            {t('dashboard.seeAll')}
                          </button>
                        </div>
                        <div className='space-y-3'>
                          {stats?.pendingReviews > 0 && (
                            <div
                              className='dashboard-pending-task-item dashboard-pending-task-warning'
                              onClick={() => navigate('/doctors/reviews')}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {stats.pendingReviews} {t('dashboard.reviewsPending')}
                                </span>
                                <span className='dashboard-pending-task-arrow'>→</span>
                              </div>
                            </div>
                          )}
                          {stats?.patientsWaiting > 0 && (
                            <div
                              className='dashboard-pending-task-item dashboard-pending-task-primary'
                              onClick={() => navigate('/appointments?status=in_queue,arrived')}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {stats.patientsWaiting} {t('dashboard.patientsWaiting')}
                                </span>
                                <span className='dashboard-pending-task-arrow'>→</span>
                              </div>
                            </div>
                          )}
                          {(stats?.labReportsToReview ?? 0) > 0 && (
                            <div
                              className='dashboard-pending-task-item dashboard-pending-task-primary'
                              onClick={() => navigate('/reports')}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {stats.labReportsToReview} {t('dashboard.labReportsToReview')}
                                </span>
                                <span className='dashboard-pending-task-arrow'>→</span>
                              </div>
                            </div>
                          )}
                          {(stats?.newMessages ?? 0) > 0 && (
                            <div
                              className='dashboard-pending-task-item dashboard-pending-task-primary'
                              onClick={() => navigate('/doctors/messages')}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {stats.newMessages} {t('dashboard.newMessages')}
                                </span>
                                <span className='dashboard-pending-task-arrow'>→</span>
                              </div>
                            </div>
                          )}
                          {(stats?.prescriptionsToApprove ?? 0) > 0 && (
                            <div
                              className='dashboard-pending-task-item dashboard-pending-task-primary'
                              onClick={() => navigate('/prescriptions?status=draft')}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {stats.prescriptionsToApprove}{' '}
                                  {t('dashboard.prescriptionsToApprove')}
                                </span>
                                <span className='dashboard-pending-task-arrow'>→</span>
                              </div>
                            </div>
                          )}
                          {(!stats?.pendingReviews || stats.pendingReviews === 0) &&
                            (!stats?.patientsWaiting || stats.patientsWaiting === 0) &&
                            (stats?.labReportsToReview ?? 0) === 0 &&
                            (stats?.newMessages ?? 0) === 0 &&
                            (stats?.prescriptionsToApprove ?? 0) === 0 && (
                              <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
                                {t('dashboard.noPendingTasks')}
                              </p>
                            )}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </AlertsSection>

              {/* Dashboard actions – ActionsSection (STEP 5) */}
              {!isDoctor && <ActionsSection failedTransactions={stats?.failed_transactions ?? 0} />}

              {/* Key Statistics – KPISection (STEP 5) */}
              <KPISection className='dashboard-section-key-metrics'>
                {/* Section Header */}
                <div className='section-header mb-4'>
                  <div className='accent-bar accent-bar-primary' />
                  <h2 className='section-title'>{t('dashboard.keyMetrics')}</h2>
                </div>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 dashboard-grid ${isDoctor ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-4'}`}
                >
                  {isDoctor ? (
                    <>
                      <StatsCard
                        title={t('dashboard.todayAppointmentsLabel')}
                        value={stats?.todayAppointments || 0}
                        trend={stats?.appointmentsTrend}
                        icon='calendar'
                        colorScheme='primary'
                        onClick={() => navigate('/appointments')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.thisWeekAppointments')}
                        value={stats?.thisWeekAppointments ?? 0}
                        trend={null}
                        icon='calendar'
                        colorScheme='primary'
                        onClick={() => navigate('/appointments')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.thisMonthAppointments')}
                        value={stats?.thisMonthAppointments ?? 0}
                        trend={null}
                        icon='calendar'
                        colorScheme='primary'
                        onClick={() => navigate('/appointments')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.totalPatients')}
                        value={stats?.totalPatients || 0}
                        trend={stats?.patientsTrend}
                        icon='patients'
                        colorScheme='primary'
                        onClick={() => navigate('/patients')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.queueCount')}
                        value={stats?.patientsWaiting || 0}
                        trend={null}
                        icon='queue'
                        colorScheme='warning'
                        onClick={() => navigate('/appointments?status=in_queue,arrived')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.revenueThisMonth')}
                        value={formatCurrency(stats?.revenue || 0)}
                        trend={stats?.revenueTrend}
                        icon='currency-dollar'
                        colorScheme='primary'
                        onClick={() => navigate('/doctors/earnings')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.videoCallsThisMonth')}
                        value={stats?.videoCallsThisMonth ?? 0}
                        trend={null}
                        icon='video'
                        colorScheme='primary'
                        onClick={() => navigate('/telemedicine')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.averageRating')}
                        value={
                          stats?.averageRating != null
                            ? Number(stats.averageRating).toFixed(1)
                            : '—'
                        }
                        trend={null}
                        icon='star'
                        colorScheme='success'
                        onClick={() => navigate('/doctors/reviews')}
                        loading={statsLoading}
                      />
                    </>
                  ) : (
                    <>
                      <StatsCard
                        title={t('dashboard.totalPatients')}
                        value={stats?.activePatients || stats?.patients?.active || 0}
                        trend={stats?.patientsTrend}
                        icon='patients'
                        colorScheme='primary'
                        layout='default'
                        onClick={() => navigate('/patients')}
                        loading={statsLoading}
                      />
                      <StatsCard
                        title={t('dashboard.todayAppointmentsLabel')}
                        value={stats?.todayAppointments || stats?.appointments?.todayTotal || 0}
                        subtitle={`${stats?.appointments?.upcoming || 0} ${t('dashboard.upcoming') || 'upcoming'}`}
                        trend={stats?.appointmentsTrend}
                        icon='calendar'
                        colorScheme='primary'
                        layout='compact'
                        onClick={() => navigate('/appointments')}
                        loading={statsLoading}
                      />
                      {canViewRevenueReports(user?.role) && (
                        <StatsCard
                          title={t('dashboard.todayRevenue')}
                          value={formatCurrency(
                            stats?.todayRevenue || stats?.revenue?.today?.paid || 0,
                          )}
                          subtitle={`${t('dashboard.total') || 'Total'}: ${formatCurrency(stats?.revenue?.today?.total || 0)}`}
                          trend={stats?.revenueTrend}
                          icon='currency-dollar'
                          colorScheme='success'
                          layout='stacked'
                          onClick={() => navigate('/invoices')}
                          loading={statsLoading}
                        />
                      )}
                      <StatsCard
                        title={t('dashboard.queueStatus') || 'Queue Status'}
                        value={Object.values(stats?.queue || {}).reduce((a, b) => a + b, 0)}
                        subtitle={t('dashboard.patientsInQueue') || 'patients in queue'}
                        icon='queue'
                        colorScheme='warning'
                        layout='minimal'
                        onClick={() => navigate('/queue')}
                        loading={statsLoading}
                      />
                    </>
                  )}
                </div>
              </KPISection>

              {/* Trends – from /api/dashboard/all when clinic; no extra request */}
              {!isDoctor && clinicTenantId && (
                <TrendsSection tenantId={clinicTenantId} trends={dashboardAll.trends} />
              )}

              {/* Main Content – Today's Appointments & Calendar – TablesSection lazy load (STEP 6) */}
              {!isDoctor && (
                <TablesSection>
                  {/* Section Header */}
                  <div className='section-header mb-4'>
                    <div className='accent-bar accent-bar-primary' />
                    <h2 className='section-title'>{t('dashboard.todaySchedule')}</h2>
                  </div>
                  <div className='grid grid-cols-1 lg:grid-cols-2 dashboard-grid items-stretch dashboard-today-schedule-grid'>
                    <div className='dashboard-card-cell dashboard-today-schedule-cell'>
                      <Card className='dashboard-list-card dashboard-list-card-primary dashboard-today-schedule-card p-6 h-full flex flex-col'>
                        <AppointmentsListWithHook
                          filters={{ status: 'scheduled' }}
                          limit={30}
                          visibleCount={5}
                          title={t('dashboard.todayAppointments')}
                          seeAllHref='/appointments'
                        />
                      </Card>
                    </div>
                    <div className='dashboard-card-cell dashboard-today-schedule-cell'>
                      <ErrorBoundary>
                        <CalendarWidget
                          loading={listsLoading}
                          doctorId={isDoctor ? (user?.id ?? user?._id) : undefined}
                          onDateSelect={(date) => {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            navigate(`/appointments?date=${y}-${m}-${d}`);
                          }}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </TablesSection>
              )}

              {/* Main Content – 3 cards per row: Summary, Next Patient, Patients Review */}
              <div className='dashboard-section'>
                {/* Section Header */}
                <div className='section-header mb-4'>
                  <div className='accent-bar accent-bar-secondary' />
                  <h2 className='section-title'>{t('dashboard.overview')}</h2>
                </div>
                <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid items-stretch'>
                  {!isDoctor && (
                    <>
                      <div className='dashboard-card-cell'>
                        <PatientsSummaryChart
                          data={
                            stats?.patientsSummary || {
                              newPatients: stats?.newPatientsThisMonth || 0,
                              oldPatients: Math.max(
                                0,
                                (stats?.activePatients || 0) - (stats?.newPatientsThisMonth || 0),
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
                                navigate(`/patients/${todayAppointments[0].patientId._id}`);
                              }
                            }}
                            onChat={() => {
                              if (todayAppointments[0]?._id) {
                                navigate(`/telemedicine/${todayAppointments[0]._id}`);
                              }
                            }}
                            onStartVideo={handleStartVideo}
                          />
                        </div>
                      ) : null}
                      <div className='dashboard-card-cell'>
                        <PatientsReviewCard loading={statsLoading} />
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
                          onSeeAll={() => navigate('/appointments')}
                          onRowMouseEnter={(item) => item?._id && prefetchAppointment(item._id)}
                          virtualizeAbove={15}
                          virtualListHeight={400}
                          renderItem={(appointment) => {
                            const start = new Date(
                              appointment.schedule?.startTime ||
                                appointment.startTime ||
                                appointment.appointmentDate,
                            );
                            const end = new Date(
                              appointment.schedule?.endTime ||
                                appointment.endTime ||
                                appointment.appointmentDate,
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
                                  navigate(`/appointments/${appointment._id || appointment.id}`)
                                }
                                onViewHistory={
                                  patientId
                                    ? () => navigate(`/doctors/patients/${patientId}`)
                                    : undefined
                                }
                                onStart={handleStartVideo}
                                onReschedule={() =>
                                  navigate(
                                    `/appointments/${appointment._id || appointment.id}?reschedule=1`,
                                  )
                                }
                                onCancel={() =>
                                  navigate(
                                    `/appointments/${appointment._id || appointment.id}?cancel=1`,
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
                                navigate(`/patients/${todayAppointments[0].patientId._id}`);
                              }
                            }}
                            onChat={() => {
                              if (todayAppointments[0]?._id) {
                                navigate(`/telemedicine/${todayAppointments[0]._id}`);
                              }
                            }}
                            onStartVideo={handleStartVideo}
                          />
                        </div>
                      )}
                      <div className='dashboard-card-cell'>
                        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
                          <div className='text-center'>
                            <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2'>
                              {t('doctors.earningsToday')}
                            </h3>
                            <p className='text-3xl font-bold text-primary-600 mb-1'>
                              {formatCurrency(stats?.earningsToday || 0)}
                            </p>
                            <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                              {stats?.completedConsultations || 0} {t('doctors.consultations')}
                            </p>
                          </div>
                        </Card>
                      </div>
                      <div className='dashboard-card-cell'>
                        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                          <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4'>
                            {t('doctors.quickStats')}
                          </h3>
                          <div className='space-y-3'>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                                {t('doctors.avgRating')}
                              </span>
                              <span className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                                {stats?.averageRating || 'N/A'}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                                {t('dashboard.totalReviews')}
                              </span>
                              <span className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                                {stats?.totalReviews || 0}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                                {t('doctors.responseRate')}
                              </span>
                              <span className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                                {stats?.responseRate || 0}%
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className='dashboard-card-cell'>
                        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                          <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4'>
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
                                  className='text-body-xs text-neutral-700 dark:text-neutral-300 flex justify-between gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2 last:border-0 last:pb-0'
                                >
                                  <span className='truncate'>{item.label}</span>
                                  <span className='text-neutral-500 dark:text-neutral-400 flex-shrink-0'>
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
                            <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
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
                            onSeeAll={() => navigate('/appointments')}
                            onRowMouseEnter={(item) => item?._id && prefetchAppointment(item._id)}
                            renderItem={(appointment) => (
                              <AppointmentListItem
                                key={appointment._id || appointment.id}
                                appointment={appointment}
                                onClick={() =>
                                  navigate(`/appointments/${appointment._id || appointment.id}`)
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
                              navigate('/appointments?status=completed&hasClinicalNote=false')
                            }
                            onRowMouseEnter={(item) => item?._id && prefetchAppointment(item._id)}
                            renderItem={(appointment) => (
                              <AppointmentListItem
                                key={appointment._id || appointment.id}
                                appointment={appointment}
                                onClick={() =>
                                  navigate(`/appointments/${appointment._id || appointment.id}`)
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
                            onSeeAll={() => navigate('/appointments?status=pending')}
                            renderItem={(request) => (
                              <div
                                key={request._id || request.id}
                                className='p-3 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors'
                                onClick={() =>
                                  navigate(`/appointments/${request._id || request.id}`)
                                }
                              >
                                <div className='flex items-center justify-between'>
                                  <div className='flex-1'>
                                    <p className='font-semibold text-neutral-900 dark:text-neutral-100'>
                                      {request.patientId?.firstName} {request.patientId?.lastName}
                                    </p>
                                    <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                                      {new Date(
                                        request.appointmentDate || request.startTime,
                                      ).toLocaleDateString()}{' '}
                                      at{' '}
                                      {new Date(request.startTime).toLocaleTimeString(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                    {request.reason && (
                                      <p className='text-xs text-neutral-500 mt-1'>
                                        {request.reason}
                                      </p>
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1.5 ml-4 shrink-0'>
                                    <Button
                                      variant='success'
                                      size='xs'
                                      iconOnly
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/appointments/${request._id || request.id}/edit?status=confirmed`,
                                        );
                                      }}
                                      aria-label={t('common.accept')}
                                      title={t('common.accept')}
                                      className='hover:scale-105 transition-transform'
                                    >
                                      <CheckIcon className='icon icon-xs' />
                                    </Button>
                                    <Button
                                      variant='danger'
                                      size='xs'
                                      iconOnly
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/appointments/${request._id || request.id}/edit?status=cancelled`,
                                        );
                                      }}
                                      aria-label={t('common.decline')}
                                      title={t('common.decline')}
                                      className='hover:scale-105 transition-transform'
                                    >
                                      <XIcon className='icon icon-xs' />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
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
                            onSeeAll={() => navigate('/patients')}
                            onRowMouseEnter={(item) => item?._id && prefetchPatient(item._id)}
                            renderItem={(patient) => (
                              <PatientListItem
                                key={patient._id || patient.id}
                                patient={patient}
                                onClick={() => navigate(`/patients/${patient._id || patient.id}`)}
                              />
                            )}
                          />
                        </div>
                      )}

                      <div className='dashboard-card-cell'>
                        <ErrorBoundary>
                          <CalendarWidget
                            loading={listsLoading}
                            doctorId={isDoctor ? (user?.id ?? user?._id) : undefined}
                            onDateSelect={(date) => {
                              const y = date.getFullYear();
                              const m = String(date.getMonth() + 1).padStart(2, '0');
                              const d = String(date.getDate()).padStart(2, '0');
                              navigate(`/appointments?date=${y}-${m}-${d}`);
                            }}
                          />
                        </ErrorBoundary>
                      </div>

                      {stats?.totalReviews > 0 && (
                        <div className='dashboard-card-cell'>
                          <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                            <div className='flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
                              <h3 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                                {t('dashboard.patientFeedback')}
                              </h3>
                              <Link
                                href='/doctors/reviews'
                                className='inline-flex items-center justify-center gap-1 px-2 py-1.5 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-sm font-medium shrink-0'
                                aria-label={t('common.viewAll')}
                              >
                                <span className='text-sm'>{t('common.viewAll')}</span>
                                <ChevronRightIcon className='icon icon-xs' ariaHidden />
                              </Link>
                            </div>
                            <div className='space-y-3'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                                  {t('dashboard.averageRating')}
                                </span>
                                <div className='flex items-center gap-2'>
                                  <span className='text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
                                    {stats.averageRating != null
                                      ? Number(stats.averageRating).toFixed(1)
                                      : '—'}
                                  </span>
                                  <div className='flex'>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <StarIcon
                                        key={star}
                                        className={`icon icon-sm ${
                                          star <= Math.round(stats.averageRating ?? 0)
                                            ? 'text-yellow-400 dark:text-yellow-500'
                                            : 'text-neutral-300 dark:text-neutral-500'
                                        }`}
                                        ariaHidden
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm text-neutral-600 dark:text-neutral-400'>
                                  {t('dashboard.totalReviews')}
                                </span>
                                <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
                                  {stats.totalReviews}
                                </span>
                              </div>
                              {stats.pendingReviews > 0 && (
                                <div className='mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg'>
                                  <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                                    {stats.pendingReviews} appointment
                                    {stats.pendingReviews > 1 ? 's' : ''}{' '}
                                    {t('dashboard.needReview')}
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

              {/* Charts Section - Only for non-doctors. Graceful degradation when charts fail. */}
              {!isDoctor && (
                <div className='dashboard-section'>
                  <ErrorBoundary>
                    {dashboardAll.error ? (
                      <Card className='dashboard-list-card dashboard-list-card-primary p-6 lg:col-span-3'>
                        <p className='text-neutral-600 dark:text-neutral-400 text-center mb-4'>
                          {t('dashboard.chartsUnavailable') || 'Charts temporarily unavailable.'}
                        </p>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => dashboardAll.refresh()}
                        >
                          {t('common.retry')}
                        </Button>
                      </Card>
                    ) : (
                      <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid items-stretch'>
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
                    )}
                  </ErrorBoundary>
                </div>
              )}

              {/* Last updated timestamp */}
              {!isDoctor && stats?.lastUpdated && (
                <div className='mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400'>
                  {t('dashboard.lastUpdated') || 'Last updated'}:{' '}
                  {new Date(stats.lastUpdated).toLocaleString()}
                </div>
              )}

              {/* Critical Lists - 2 columns - Only for non-doctors */}
              {!isDoctor && (
                <div className='dashboard-section'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 dashboard-grid items-stretch'>
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
                          onClick={() => navigate(`/invoices/${invoice._id || invoice.id}`)}
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
                          onClick={() => navigate(`/inventory/items/${item._id || item.id}`)}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </OverviewTab>
          </TabContent>
        </div>
      </ProfilerWrapper>
    </Layout>
  );
}
