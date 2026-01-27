'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Dashboard components
import { AppointmentListItem } from './components/AppointmentListItem';
import { AppointmentRequestCard } from './components/AppointmentRequestCard';
import { CalendarWidget } from './components/CalendarWidget';
import { ChartCard } from './components/ChartCard';
import { CriticalAlerts } from './components/CriticalAlerts';
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

// Custom hooks
import { useDashboardCharts } from './hooks/useDashboardCharts';
import { useDashboardLists } from './hooks/useDashboardLists';
import { useDashboardStats } from './hooks/useDashboardStats';
import { useDoctorDashboardLists } from './hooks/useDoctorDashboardLists';
import { useDoctorDashboardStats } from './hooks/useDoctorDashboardStats';

/* Dashboard styles loaded by app/dashboard/layout.jsx for reliable load on client nav */

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();

  // Check if user is a doctor
  const isDoctor = user?.role === 'doctor';

  // Use doctor-specific hooks if user is a doctor, otherwise use general hooks
  const generalStats = useDashboardStats();
  const doctorStats = useDoctorDashboardStats();
  const stats = isDoctor ? doctorStats.stats : generalStats.stats;
  const statsLoading = isDoctor ? doctorStats.loading : generalStats.loading;
  const fetchStats = isDoctor ? doctorStats.fetchStats : generalStats.fetchStats;

  const { chartData, loading: chartsLoading, fetchChartData } = useDashboardCharts();

  const generalLists = useDashboardLists();
  const doctorLists = useDoctorDashboardLists();

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
  const criticalAlerts = isDoctor ? [] : generalLists.criticalAlerts;
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

  // Show skeleton when initial data is loading (with timeout to prevent infinite loading)
  const isInitialLoading = statsLoading || chartsLoading || listsLoading;

  // Show skeleton only for first load, then render with whatever data we have
  // Also add a maximum loading time to prevent infinite loading
  // IMPORTANT: All hooks must be called before any early returns
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  const refreshIntervalRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isInitialLoading) {
      setHasRenderedOnce(true);
    }
  }, [isInitialLoading]);

  // Add a timeout to force render after 5 seconds if still loading
  useEffect(() => {
    if (isInitialLoading && !hasRenderedOnce) {
      const timeout = setTimeout(() => {
        console.warn('Dashboard: Loading timeout - forcing render');
        setForceRender(true);
        setHasRenderedOnce(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isInitialLoading, hasRenderedOnce]);

  // Lightweight auto-refresh without flicker (only after initial fetch)
  useEffect(() => {
    if (authLoading || !user || !hasFetchedRef.current) return;

    const REFRESH_MS = 5 * 60 * 1000; // 5 minutes (reduced from 1 minute to save resources)

    const runRefresh = () => {
      if (hasFetchedRef.current) {
        fetchStats().catch((err) => console.error('Error refreshing stats:', err));
        fetchDashboardLists().catch((err) => console.error('Error refreshing lists:', err));
        if (!isDoctor) {
          fetchChartData().catch((err) => console.error('Error refreshing charts:', err));
        }
      }
    };

    // Start polling only after initial fetch
    refreshIntervalRef.current = setInterval(runRefresh, REFRESH_MS);

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
          refreshIntervalRef.current = setInterval(runRefresh, REFRESH_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [authLoading, user, isDoctor]); // Removed function dependencies

  // Fetch all data on mount - ONLY ONCE
  useEffect(() => {
    if (authLoading || hasFetchedRef.current) return;

    if (!user) {
      const timer = setTimeout(() => router.push('/login'), 100);
      return () => clearTimeout(timer);
    }

    // Redirect super admin to admin dashboard
    if (user && user.role === 'super_admin') {
      router.push('/admin');
      return;
    }

    // Mark as fetched and fetch data
    hasFetchedRef.current = true;

    // Fetch doctor-specific or general data
    if (isDoctor) {
      fetchStats().catch((err) => console.error('Error fetching stats:', err));
      fetchDashboardLists().catch((err) => console.error('Error fetching lists:', err));
    } else {
      fetchStats().catch((err) => console.error('Error fetching stats:', err));
      fetchChartData().catch((err) => console.error('Error fetching charts:', err));
      fetchDashboardLists().catch((err) => console.error('Error fetching lists:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router, isDoctor]); // Removed function dependencies

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

  // Show skeleton only if we haven't rendered yet and are still loading
  if (isInitialLoading && !hasRenderedOnce && !forceRender) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

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

  const handleMarkAsRead = (id) => {
    // Mark individual notification as read
    console.log('Mark as read:', id);
  };

  const handleMarkAllAsRead = () => {
    // Mark all notifications as read
    console.log('Mark all as read');
  };

  return (
    <Layout>
      <div className='dashboard-container'>
        {/* Page Header */}
        <PageHeader
          title={t('dashboard.overview')}
          subtitle={formatDateDisplay()}
          notifications={notifications}
          unreadCount={criticalAlerts.length}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          actionButton={
            <QuickActions onNavigate={(path) => router.push(path)} loading={false} />
          }
        />

        {/* Critical Alerts / Pending Tasks (Quick Actions moved to header bar) */}
        <div className='dashboard-section'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3'>
            {/* Critical Alerts - Only for non-doctors */}
            {!isDoctor && criticalAlerts && criticalAlerts.length > 0 && (
              <div className='lg:col-span-2'>
                <CriticalAlerts
                  alerts={criticalAlerts}
                  onViewAll={(alert) => {
                    if (alert?.type === 'inventory') router.push('/inventory');
                    else if (alert?.type === 'appointments') router.push('/appointments');
                    else router.push('/reports');
                  }}
                />
              </div>
            )}
            {/* Doctor-specific: Pending Tasks Card */}
            {isDoctor && (
              <div className='lg:col-span-2'>
                <Card className='p-6 h-full'>
                  <div className='flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200'>
                    <div className='w-3 h-3 bg-warning-500 rounded-full'></div>
                    <h3 className='text-lg font-bold text-neutral-900'>Pending Tasks</h3>
                  </div>
                  <div className='space-y-3'>
                    {stats?.pendingReviews > 0 && (
                      <div
                        className='p-3 bg-warning-50 border border-warning-200 rounded-lg cursor-pointer hover:bg-warning-100 transition-colors'
                        onClick={() => router.push('/doctors/reviews')}
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-warning-900'>
                            {stats.pendingReviews} Review{stats.pendingReviews > 1 ? 's' : ''}{' '}
                            Pending
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
                            {stats.patientsWaiting} Patient{stats.patientsWaiting > 1 ? 's' : ''}{' '}
                            Waiting
                          </span>
                          <span className='text-primary-600'>→</span>
                        </div>
                      </div>
                    )}
                    {(!stats?.pendingReviews || stats.pendingReviews === 0) &&
                      (!stats?.patientsWaiting || stats.patientsWaiting === 0) && (
                        <p className='text-sm text-neutral-500 text-center py-4'>
                          No pending tasks
                        </p>
                      )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Key Statistics Cards - Doctor-specific or General */}
        <div className='dashboard-section'>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${isDoctor ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'} gap-3`}
          >
            {isDoctor ? (
              <>
                <StatsCard
                  title='Total Patients'
                  value={stats?.totalPatients || 0}
                  trend={stats?.patientsTrend}
                  icon='patients'
                  colorScheme='primary'
                  onClick={() => router.push('/patients')}
                  loading={statsLoading}
                />
                <StatsCard
                  title="Today's Appointments"
                  value={stats?.todayAppointments || 0}
                  trend={stats?.appointmentsTrend}
                  icon='calendar'
                  colorScheme='primary'
                  onClick={() => router.push('/appointments')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Patients Waiting'
                  value={stats?.patientsWaiting || 0}
                  trend={null}
                  icon='users'
                  colorScheme='warning'
                  onClick={() => router.push('/appointments?status=in_queue,arrived')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Completed Today'
                  value={stats?.completedConsultations || 0}
                  trend={null}
                  icon='check-circle'
                  colorScheme='success'
                  onClick={() => router.push('/appointments?status=completed')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Pending Reviews'
                  value={stats?.pendingReviews || 0}
                  trend={null}
                  icon='document-text'
                  colorScheme='warning'
                  onClick={() => router.push('/doctors/reviews')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Revenue (This Month)'
                  value={formatCurrency(stats?.revenue || 0)}
                  trend={stats?.revenueTrend}
                  icon='currency-dollar'
                  colorScheme='primary'
                  onClick={() => router.push('/doctors/earnings')}
                  loading={statsLoading}
                />
              </>
            ) : (
              <>
                <StatsCard
                  title='Total Patient'
                  value={stats?.activePatients || 0}
                  trend={stats?.patientsTrend}
                  icon='patients'
                  colorScheme='primary'
                  onClick={() => router.push('/patients')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Today Patient'
                  value={stats?.todayAppointments || 0}
                  trend={stats?.appointmentsTrend}
                  icon='patients'
                  colorScheme='primary'
                  onClick={() => router.push('/patients')}
                  loading={statsLoading}
                />
                <StatsCard
                  title='Today Appointments'
                  value={stats?.todayAppointments || 0}
                  trend={stats?.appointmentsTrend}
                  icon='calendar'
                  colorScheme='primary'
                  onClick={() => router.push('/appointments')}
                  loading={statsLoading}
                />
              </>
            )}
          </div>
        </div>

        {/* Main Content – 3 cards per row, even size (from Patients Summary onward) */}
        <div className='dashboard-section'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch'>
            {/* Non-doctor: order by importance – Summary, Today, Next Patient, Patients Review, Calendar, Appointment Request */}
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
                    />
                  </div>
                )}
                <div className='dashboard-card-cell'>
                  <PatientsReviewCard loading={statsLoading} />
                </div>
                <div className='dashboard-card-cell'>
                  <CalendarWidget
                    loading={listsLoading}
                    onDateSelect={(date) => {
                      router.push(`/appointments?date=${date.toISOString().split('T')[0]}`);
                    }}
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
                  />
                </div>
              </>
            )}

            {/* Doctor: order by importance – Today’s Schedule, Next Patient, Earnings, Quick Stats, Upcoming, Pending Reviews, New Requests, Calendar, Recent Patients, Patient Feedback */}
            {isDoctor && (
              <>
                <div className='dashboard-card-cell'>
                  <DashboardListCard
                    title="Today's Schedule"
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
                    />
                  </div>
                )}
                <div className='dashboard-card-cell'>
                  <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
                    <div className='text-center'>
                      <h3 className='text-sm font-medium text-neutral-600 mb-2'>Earnings Today</h3>
                      <p className='text-3xl font-bold text-primary-600 mb-1'>
                        {formatCurrency(stats?.earningsToday || 0)}
                      </p>
                      <p className='text-xs text-neutral-500'>
                        {stats?.completedConsultations || 0} consultations
                      </p>
                    </div>
                  </Card>
                </div>
                <div className='dashboard-card-cell'>
                  <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                    <h3 className='text-sm font-medium text-neutral-600 mb-4'>Quick Stats</h3>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-neutral-600'>Avg. Rating</span>
                        <span className='text-lg font-bold text-neutral-900'>
                          {stats?.averageRating || 'N/A'}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-neutral-600'>Total Reviews</span>
                        <span className='text-lg font-bold text-neutral-900'>
                          {stats?.totalReviews || 0}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-neutral-600'>Response Rate</span>
                        <span className='text-lg font-bold text-neutral-900'>
                          {stats?.responseRate || 0}%
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {upcomingAppointments && upcomingAppointments.length > 0 && (
                  <div className='dashboard-card-cell'>
                    <DashboardListCard
                      title='Upcoming Appointments'
                    data={upcomingAppointments}
                    loading={listsLoading}
                    colorScheme='primary'
                    emptyMessage='No upcoming appointments'
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
                      title='Pending Reviews'
                    data={pendingReviews}
                    loading={listsLoading}
                    colorScheme='warning'
                    emptyMessage='No pending reviews'
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
                      title='New Patient Requests'
                      data={newPatientRequests.slice(0, 5)}
                      loading={listsLoading}
                      colorScheme='primary'
                      emptyMessage='No new patient requests'
                      showSeeAll={true}
                      onSeeAll={() => router.push('/appointments?status=pending')}
                      renderItem={(request) => (
                        <div
                          key={request._id || request.id}
                          className='p-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors'
                          onClick={() => router.push(`/appointments/${request._id || request.id}`)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <p className='font-semibold text-neutral-900'>
                                {request.patientId?.firstName} {request.patientId?.lastName}
                              </p>
                              <p className='text-sm text-neutral-600'>
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
                                Accept
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
                                Decline
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
                      title='Recent Patients'
                    data={recentPatients.slice(0, 5)}
                    loading={listsLoading}
                    colorScheme='primary'
                    emptyMessage='No recent patients'
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
                  <CalendarWidget
                  loading={listsLoading}
                  onDateSelect={(date) => {
                    router.push(`/appointments?date=${date.toISOString().split('T')[0]}`);
                  }}
                />
                </div>

                {stats?.totalReviews > 0 && (
                  <div className='dashboard-card-cell'>
                    <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-bold text-neutral-900'>Patient Feedback</h3>
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => router.push('/doctors/reviews')}
                      >
                        View All
                      </Button>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-neutral-600'>Average Rating</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-2xl font-bold text-neutral-900'>
                            {stats.averageRating.toFixed(1)}
                          </span>
                          <div className='flex'>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`icon icon-sm ${
                                  star <= Math.round(stats.averageRating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-neutral-300'
                                }`}
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-neutral-600'>Total Reviews</span>
                        <span className='font-semibold text-neutral-900'>{stats.totalReviews}</span>
                      </div>
                      {stats.pendingReviews > 0 && (
                        <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                          <p className='text-sm text-yellow-800'>
                            {stats.pendingReviews} appointment{stats.pendingReviews > 1 ? 's' : ''}{' '}
                            need{stats.pendingReviews === 1 ? 's' : ''} review
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
    </Layout>
  );
}
