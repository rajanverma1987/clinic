'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const [chartData, setChartData] = useState({
    revenue: null,
    appointments: null,
    patients: null,
  });
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/reports/dashboard');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchDashboardLists = useCallback(async () => {
    try {
      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await apiClient.get(`/appointments?date=${today}&limit=5`);
      if (appointmentsResponse.success && appointmentsResponse.data) {
        setTodayAppointments(appointmentsResponse.data.slice(0, 5));
      }

      // Fetch recent patients
      const patientsResponse = await apiClient.get(
        '/patients?limit=5&sortBy=createdAt&sortOrder=desc'
      );
      if (patientsResponse.success && patientsResponse.data) {
        setRecentPatients(patientsResponse.data.slice(0, 5));
      }

      // Fetch overdue invoices
      const invoicesResponse = await apiClient.get('/invoices?status=pending&overdue=true&limit=5');
      if (invoicesResponse.success && invoicesResponse.data) {
        setOverdueInvoices(invoicesResponse.data.slice(0, 5));
      }

      // Fetch low stock items
      const inventoryResponse = await apiClient.get('/inventory/low-stock?limit=5');
      if (inventoryResponse.success && inventoryResponse.data) {
        setLowStockList(inventoryResponse.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard lists:', error);
    } finally {
      setLoadingLists(false);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // Last 14 days

      // Fetch revenue trend
      try {
        const revenueParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const revenueResponse = await apiClient.get(`/reports/revenue?${revenueParams}`);
        if (revenueResponse.success && revenueResponse.data) {
          setChartData((prev) => ({
            ...prev,
            revenue: revenueResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch revenue chart:', err);
      }

      // Fetch appointment trend
      try {
        const appointmentParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
        });
        const appointmentResponse = await apiClient.get(
          `/reports/appointments?${appointmentParams}`
        );
        if (appointmentResponse.success && appointmentResponse.data) {
          setChartData((prev) => ({
            ...prev,
            appointments: appointmentResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch appointment chart:', err);
      }

      // Fetch patient growth
      try {
        const patientParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy: 'day',
          includeNewPatients: 'true',
        });
        const patientResponse = await apiClient.get(`/reports/patients?${patientParams}`);
        if (patientResponse.success && patientResponse.data) {
          setChartData((prev) => ({
            ...prev,
            patients: patientResponse.data.timeSeries || [],
          }));
        }
      } catch (err) {
        console.error('Failed to fetch patient chart:', err);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoadingCharts(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(timer);
    }

    if (user) {
      fetchStats();
      fetchChartData();
      fetchDashboardLists();
    }
  }, [loading, user, router, fetchStats, fetchChartData, fetchDashboardLists]);

  // Chart rendering functions
  const renderBarChart = (data, color = 'primary', height = 200) => {
    if (!data || data.length === 0) {
      return (
        <div className='flex items-center justify-center h-[220px] text-neutral-400'>
          <p>No data available</p>
        </div>
      );
    }

    const chartData = data.slice(-14);
    const maxBarValue = Math.max(...chartData.map((d) => d.value || d.total || d.count || 0), 1);
    const chartHeight = height;

    const colorClasses = {
      primary: 'bg-primary-500 hover:bg-primary-600',
      secondary: 'bg-secondary-500 hover:bg-secondary-600',
      warning: 'bg-status-warning hover:bg-status-warning/80',
    };

    return (
      <div className='relative'>
        <div className='flex items-end h-[220px] border-b border-l border-neutral-200 pl-8 pr-4 pb-8'>
          <div className='absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-neutral-500'>
            {[100, 75, 50, 25, 0].map((percent) => (
              <span key={percent} className='transform -translate-x-full pr-2'>
                {Math.round((maxBarValue * percent) / 100)}
              </span>
            ))}
          </div>

          <div className='flex-1 flex items-end justify-between gap-1.5'>
            {chartData.map((item, index) => {
              const value = item.value || item.total || item.count || 0;
              const percentage = (value / maxBarValue) * 100;
              const barHeight = (percentage / 100) * chartHeight;

              return (
                <div key={index} className='flex-1 flex flex-col items-center group relative'>
                  <div
                    className={`w-full ${
                      colorClasses[color] || colorClasses.primary
                    } rounded-t cursor-pointer`}
                    style={{
                      height: `${Math.max(barHeight, value > 0 ? 2 : 0)}px`,
                      minHeight: value > 0 ? '2px' : '0',
                    }}
                    title={`${new Date(item.period || item.date).toLocaleDateString()}: ${value}`}
                  />
                  <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10'>
                    {value}
                  </div>
                  <span className='text-xs text-neutral-600 mt-2 text-center leading-tight'>
                    {(() => {
                      const date = new Date(item.period || item.date);
                      if (chartData.length <= 7) {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } else {
                        return date.toLocaleDateString('en-US', { month: 'short' });
                      }
                    })()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const dateFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const formatDateDisplay = () => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loadingStats) {
    return (
      <Layout>
        <div className='mb-10 relative'>
          <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
            <div>
              <h1
                className='text-neutral-900 mb-3'
                style={{
                  fontSize: '40px',
                  lineHeight: '48px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                }}
              >
                {t('dashboard.title')}
              </h1>
              <p
                className='text-neutral-700'
                style={{
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '400',
                }}
              >
                {t('dashboard.welcome')},{' '}
                <span className='font-semibold text-primary-500'>{user?.firstName}</span>!
              </p>
            </div>
          </div>
        </div>
        <Loader size='lg' text='Loading statistics...' className='h-64' />
      </Layout>
    );
  }

  return (
    <Layout>
      <DashboardHeader
        title='Dashboard Overview'
        subtitle={formatDateDisplay()}
        notifications={notifications}
        actionButton={
          <>
            {/* Date Filter Dropdown */}
            <div className='relative'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateDropdown(!showDateDropdown);
                }}
                className='flex items-center bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50'
                style={{
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-3)',
                  paddingTop: 'var(--space-2)',
                  paddingBottom: 'var(--space-2)',
                  gap: 'var(--gap-2)',
                }}
              >
                <span
                  className='text-neutral-700 font-medium'
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    lineHeight: 'var(--text-body-sm-line-height)',
                  }}
                >
                  {dateFilterOptions.find((opt) => opt.value === dateFilter)?.label || 'Today'}
                </span>
                <svg
                  className={`w-4 h-4 text-neutral-500 ${showDateDropdown ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDateDropdown && (
                <>
                  <div
                    className='fixed inset-0 z-40'
                    onClick={() => setShowDateDropdown(false)}
                  ></div>
                  <div
                    className='absolute right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[160px]'
                    style={{ top: '100%' }}
                  >
                    {dateFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateFilter(option.value);
                          setShowDateDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-neutral-50 ${
                          dateFilter === option.value
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-neutral-700'
                        }`}
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          lineHeight: 'var(--text-body-sm-line-height)',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Calendar Icon Button */}
            <button
              className='bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 flex items-center justify-center'
              style={{
                width: 'var(--size-md)',
                height: 'var(--size-md)',
              }}
              title='Calendar'
            >
              <svg
                className='w-5 h-5 text-neutral-600'
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
            </button>
          </>
        }
      />

      {/* Key Statistics Cards */}
      {stats && (
        <div className='mb-10' style={{ marginBottom: 'var(--space-10)' }}>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6'>
            {/* Today's Appointments Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-primary-100 hover:border-primary-300 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/appointments')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-primary-500 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-primary-400 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-primary-500)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-primary-600 font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t('dashboard.todayAppointments')}
                      </p>
                    </div>
                    <p
                      className='text-primary-900'
                      style={{
                        fontSize: '36px',
                        lineHeight: '44px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {stats.todayAppointments}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      {t('dashboard.activeToday')}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #2D9CDB, #0F89C7, #0A6B9A)',
                      backgroundColor: '#2D9CDB',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Progress Indicator */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div
                    className='flex items-center justify-between'
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-neutral-500)',
                      marginBottom: '4px',
                    }}
                  >
                    <span>Today&apos;s Schedule</span>
                    <span className='font-semibold' style={{ color: 'var(--color-primary-600)' }}>
                      100%
                    </span>
                  </div>
                  <div
                    className='w-full bg-neutral-100 rounded-full overflow-hidden'
                    style={{ height: '6px' }}
                  >
                    <div
                      className='bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full'
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Today's Revenue Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-secondary-100 hover:border-secondary-300 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/reports')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-secondary-500 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-secondary-400 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-secondary-500)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-secondary-600 font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Today's Revenue
                      </p>
                    </div>
                    <p
                      className='text-secondary-700'
                      style={{
                        fontSize: '32px',
                        lineHeight: '40px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {formatCurrency(stats.todayRevenue || 0)}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      Collected today
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #27AE60, #229954, #1E8449)',
                      backgroundColor: '#27AE60',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Comparison */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-xs' style={{ color: 'var(--color-neutral-500)' }}>
                      vs yesterday
                    </span>
                    <div className='flex items-center' style={{ gap: '4px' }}>
                      <svg
                        style={{
                          width: '14px',
                          height: '14px',
                          color: 'var(--color-secondary-600)',
                        }}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                        />
                      </svg>
                      <span
                        className='text-xs font-semibold'
                        style={{ color: 'var(--color-secondary-700)' }}
                      >
                        +{stats.todayRevenueChange || '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Month Revenue Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-secondary-100 hover:border-secondary-300 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/reports')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-secondary-500 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-secondary-400 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-secondary-500)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-secondary-600 font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t('dashboard.monthRevenue')}
                      </p>
                    </div>
                    <p
                      className='text-secondary-700'
                      style={{
                        fontSize: '32px',
                        lineHeight: '40px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {formatCurrency(stats.monthRevenue)}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      {t('dashboard.thisMonth')}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #27AE60, #229954, #1E8449)',
                      backgroundColor: '#27AE60',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Trend Indicator */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div className='flex items-center' style={{ gap: '8px' }}>
                    <div
                      className='flex items-center'
                      style={{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        backgroundColor: 'var(--color-secondary-50)',
                        borderRadius: '8px',
                      }}
                    >
                      <svg
                        style={{
                          width: '14px',
                          height: '14px',
                          color: 'var(--color-secondary-600)',
                        }}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                        />
                      </svg>
                      <span
                        className='text-xs font-semibold'
                        style={{ color: 'var(--color-secondary-700)', marginLeft: '4px' }}
                      >
                        +12%
                      </span>
                    </div>
                    <span className='text-xs' style={{ color: 'var(--color-neutral-500)' }}>
                      vs last month
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* New Patients This Month Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-primary-100 hover:border-primary-300 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/patients')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-primary-500 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-primary-400 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-primary-500)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-primary-600 font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        New Patients
                      </p>
                    </div>
                    <p
                      className='text-primary-900'
                      style={{
                        fontSize: '36px',
                        lineHeight: '44px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {stats.newPatientsThisMonth || 0}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      This month
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #2D9CDB, #0F89C7, #0A6B9A)',
                      backgroundColor: '#2D9CDB',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Growth Comparison */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-xs' style={{ color: 'var(--color-neutral-500)' }}>
                      vs last month
                    </span>
                    <div className='flex items-center' style={{ gap: '4px' }}>
                      <svg
                        style={{ width: '14px', height: '14px', color: 'var(--color-primary-600)' }}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                        />
                      </svg>
                      <span
                        className='text-xs font-semibold'
                        style={{ color: 'var(--color-primary-700)' }}
                      >
                        +{stats.newPatientsChange || '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Total Patients Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-primary-100 hover:border-primary-300 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/patients')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-primary-500 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-primary-400 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-primary-500)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-primary-600 font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t('dashboard.totalPatients')}
                      </p>
                    </div>
                    <p
                      className='text-primary-900'
                      style={{
                        fontSize: '36px',
                        lineHeight: '44px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {stats.totalPatients}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      {t('dashboard.allTime')}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #2D9CDB, #0F89C7, #0A6B9A)',
                      backgroundColor: '#2D9CDB',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Growth Indicator */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div className='flex items-center' style={{ gap: '8px' }}>
                    <div
                      className='flex items-center'
                      style={{
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        backgroundColor: 'var(--color-primary-50)',
                        borderRadius: '8px',
                      }}
                    >
                      <svg
                        style={{ width: '14px', height: '14px', color: 'var(--color-primary-600)' }}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                        />
                      </svg>
                      <span
                        className='text-xs font-semibold'
                        style={{ color: 'var(--color-primary-700)', marginLeft: '4px' }}
                      >
                        Active
                      </span>
                    </div>
                    <span className='text-xs' style={{ color: 'var(--color-neutral-500)' }}>
                      All registered patients
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pending Invoices Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-status-warning/30 hover:border-status-warning/50 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/invoices')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-status-warning rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-status-warning/80 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-status-warning)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-status-warning font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t('dashboard.pendingInvoices')}
                      </p>
                    </div>
                    <p
                      className='text-neutral-900'
                      style={{
                        fontSize: '36px',
                        lineHeight: '44px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {stats.pendingInvoices}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      {t('dashboard.awaitingPayment')}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #F59E0B, #D97706, #B45309)',
                      backgroundColor: '#F59E0B',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Alert Badge */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div
                    className='flex items-center'
                    style={{
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}
                  >
                    <svg
                      style={{
                        width: '14px',
                        height: '14px',
                        color: 'var(--color-status-warning)',
                        marginRight: '8px',
                      }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                    <span
                      className='text-xs font-semibold'
                      style={{ color: 'var(--color-status-warning)' }}
                    >
                      Action Required
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Low Stock Items Card */}
            <Card
              className='group relative overflow-hidden bg-white border-2 border-status-error/30 hover:border-status-error/50 hover:shadow-2xl cursor-pointer transition-all duration-300'
              elevated={true}
              onClick={() => router.push('/inventory')}
              style={{
                minHeight: '180px',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Animated Background Pattern */}
              <div className='absolute inset-0 opacity-5 group-hover:opacity-10'>
                <div className='absolute top-0 right-0 w-40 h-40 bg-status-error rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-32 h-32 bg-status-error/80 rounded-full blur-2xl'></div>
              </div>

              <div className='relative z-10' style={{ padding: '20px' }}>
                <div className='flex items-start justify-between' style={{ marginBottom: '12px' }}>
                  <div className='flex-1'>
                    <div className='flex items-center' style={{ gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'var(--color-status-error)',
                          borderRadius: '50%',
                        }}
                      ></div>
                      <p
                        className='text-status-error font-semibold'
                        style={{
                          fontSize: '11px',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t('dashboard.lowStockItems')}
                      </p>
                    </div>
                    <p
                      className='text-neutral-900'
                      style={{
                        fontSize: '36px',
                        lineHeight: '44px',
                        letterSpacing: '-0.04em',
                        fontWeight: '900',
                        marginBottom: '4px',
                      }}
                    >
                      {stats.lowStockItems}
                    </p>
                    <p
                      className='text-neutral-500 font-medium'
                      style={{
                        fontSize: '13px',
                        lineHeight: '18px',
                      }}
                    >
                      {t('dashboard.needsAttention')}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(to bottom right, #EF4444, #DC2626, #B91C1C)',
                      backgroundColor: '#EF4444',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg
                      className='no-tint'
                      style={{ width: '24px', height: '24px', color: '#FFFFFF' }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                  </div>
                </div>
                {/* Alert Badge */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <div
                    className='flex items-center'
                    style={{
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <svg
                      style={{
                        width: '14px',
                        height: '14px',
                        color: 'var(--color-status-error)',
                        marginRight: '8px',
                      }}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                      />
                    </svg>
                    <span
                      className='text-xs font-semibold'
                      style={{ color: 'var(--color-status-error)' }}
                    >
                      Urgent Review
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div
        className='grid grid-cols-1 lg:grid-cols-2'
        style={{ gap: '24px', marginBottom: 'var(--space-10)' }}
      >
        {/* Revenue Trend Chart */}
        <Card
          elevated={true}
          className='border-2 border-neutral-100 hover:border-secondary-200 transition-all duration-300'
          style={{
            transform: 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            className='flex items-center justify-between'
            style={{
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '2px solid var(--color-neutral-100)',
            }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-secondary-500 rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Revenue Trend
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Last 14 days performance
              </p>
            </div>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/reports')}
              className='whitespace-nowrap'
            >
              View Report
            </Button>
          </div>
          {loadingCharts ? (
            <div className='flex items-center justify-center h-[220px]'>
              <Loader size='md' inline />
            </div>
          ) : (
            renderBarChart(chartData.revenue, 'secondary', 200)
          )}
        </Card>

        {/* Appointment Trend Chart */}
        <Card
          elevated={true}
          className='border-2 border-neutral-100 hover:border-primary-200 transition-all duration-300'
          style={{
            transform: 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div
            className='flex items-center justify-between'
            style={{
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '2px solid var(--color-neutral-100)',
            }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Appointment Trend
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Last 14 days performance
              </p>
            </div>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/appointments')}
              className='whitespace-nowrap'
            >
              View All
            </Button>
          </div>
          {loadingCharts ? (
            <div className='flex items-center justify-center h-[220px]'>
              <Loader size='md' inline />
            </div>
          ) : (
            renderBarChart(chartData.appointments, 'primary', 200)
          )}
        </Card>
      </div>

      {/* Reports Section */}
      <Card
        elevated={true}
        className='border-2 border-neutral-100 transition-all duration-300'
        style={{
          marginBottom: 'var(--space-10)',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className='flex items-center mb-3' style={{ gap: 'var(--gap-2)' }}>
            <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
            <h2
              className='text-neutral-900'
              style={{
                fontSize: '28px',
                lineHeight: '36px',
                letterSpacing: '-0.03em',
                fontWeight: '800',
              }}
            >
              Reports & Analytics
            </h2>
          </div>
          <p
            className='text-neutral-500'
            style={{
              fontSize: 'var(--text-body-md)',
              lineHeight: 'var(--text-body-md-line-height)',
              fontWeight: '400',
              marginLeft: 'var(--space-5)',
            }}
          >
            Access comprehensive reports and analytics
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card
            className='group cursor-pointer hover:shadow-xl border-2 border-neutral-100 hover:border-primary-300 bg-white transition-all duration-300'
            onClick={() => router.push('/reports')}
            style={{
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className='flex flex-col items-center text-center' style={{ padding: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(to bottom right, #2D9CDB, #0F89C7)',
                  backgroundColor: '#2D9CDB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg
                  className='no-tint'
                  style={{ width: '28px', height: '28px', color: '#FFFFFF' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              </div>
              <h3
                className='text-neutral-900 font-bold'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  marginBottom: '8px',
                }}
              >
                Revenue Report
              </h3>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Financial insights and trends
              </p>
            </div>
          </Card>

          <Card
            className='group cursor-pointer hover:shadow-xl border-2 border-neutral-100 hover:border-secondary-300 bg-white'
            onClick={() => router.push('/reports')}
          >
            <div className='flex flex-col items-center text-center' style={{ padding: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(to bottom right, #27AE60, #1E8E4A)',
                  backgroundColor: '#27AE60',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg
                  className='no-tint'
                  style={{ width: '28px', height: '28px', color: '#FFFFFF' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <h3
                className='text-neutral-900 font-bold'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  marginBottom: '8px',
                }}
              >
                Patient Report
              </h3>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Patient demographics and growth
              </p>
            </div>
          </Card>

          <Card
            className='group cursor-pointer hover:shadow-xl border-2 border-neutral-100 hover:border-primary-300 bg-white transition-all duration-300'
            onClick={() => router.push('/reports')}
            style={{
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className='flex flex-col items-center text-center' style={{ padding: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(to bottom right, #2D9CDB, #0F89C7)',
                  backgroundColor: '#2D9CDB',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg
                  className='no-tint'
                  style={{ width: '28px', height: '28px', color: '#FFFFFF' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3
                className='text-neutral-900 font-bold'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  marginBottom: '8px',
                }}
              >
                Appointment Report
              </h3>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Appointment statistics and trends
              </p>
            </div>
          </Card>

          <Card
            className='group cursor-pointer hover:shadow-xl border-2 border-neutral-100 hover:border-status-warning/50 bg-white'
            onClick={() => router.push('/reports')}
          >
            <div className='flex flex-col items-center text-center' style={{ padding: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(to bottom right, #F59E0B, #D97706)',
                  backgroundColor: '#F59E0B',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg
                  className='no-tint'
                  style={{ width: '28px', height: '28px', color: '#FFFFFF' }}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                  />
                </svg>
              </div>
              <h3
                className='text-neutral-900 font-bold'
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  marginBottom: '8px',
                }}
              >
                Inventory Report
              </h3>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: '13px',
                  lineHeight: '18px',
                }}
              >
                Stock levels and usage analytics
              </p>
            </div>
          </Card>
        </div>
      </Card>

      {/* Today's Appointments & Recent Activity Section */}
      <div
        className='grid grid-cols-1 lg:grid-cols-2'
        style={{ gap: '20px', marginBottom: 'var(--space-8)' }}
      >
        {/* Today's Appointments List */}
        <Card elevated={true} className='border-2 border-neutral-100'>
          <div
            className='flex items-center justify-between pb-4 mb-6'
            style={{ borderBottom: '2px solid var(--color-neutral-100)' }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Today's Appointments
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Upcoming appointments for today
              </p>
            </div>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push('/appointments')}
              className='whitespace-nowrap'
            >
              View All
            </Button>
          </div>

          {loadingLists ? (
            <div className='flex items-center justify-center h-48'>
              <Loader size='md' inline />
            </div>
          ) : todayAppointments && todayAppointments.length > 0 ? (
            <div className='space-y-3'>
              {todayAppointments.map((appointment, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all'
                  onClick={() => router.push(`/appointments/${appointment._id || appointment.id}`)}
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className='w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center'
                      style={{ flexShrink: 0 }}
                    >
                      <svg
                        className='w-6 h-6 text-primary-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-neutral-900 truncate'>
                        {appointment.patientName || 'Patient Name'}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {appointment.reason || 'Consultation'}
                      </p>
                    </div>
                  </div>
                  <div className='text-right' style={{ flexShrink: 0 }}>
                    <p className='text-sm font-semibold text-primary-600'>
                      {appointment.time ||
                        new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </p>
                    <p className='text-xs text-neutral-500 mt-1 capitalize'>
                      {appointment.status || 'Scheduled'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-48 text-neutral-400'>
              <svg className='w-16 h-16 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <p className='text-sm'>No appointments scheduled for today</p>
            </div>
          )}
        </Card>

        {/* Recent Patients List */}
        <Card elevated={true} className='border-2 border-neutral-100'>
          <div
            className='flex items-center justify-between pb-4 mb-6'
            style={{ borderBottom: '2px solid var(--color-neutral-100)' }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-secondary-500 rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Recent Patients
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Newly registered patients
              </p>
            </div>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push('/patients')}
              className='whitespace-nowrap'
            >
              View All
            </Button>
          </div>

          {loadingLists ? (
            <div className='flex items-center justify-center h-48'>
              <Loader size='md' inline />
            </div>
          ) : recentPatients && recentPatients.length > 0 ? (
            <div className='space-y-3'>
              {recentPatients.map((patient, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer transition-all'
                  onClick={() => router.push(`/patients/${patient._id || patient.id}`)}
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className='w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center'
                      style={{ flexShrink: 0 }}
                    >
                      <span className='text-lg font-bold text-secondary-600'>
                        {patient.firstName?.charAt(0) || 'P'}
                        {patient.lastName?.charAt(0) || 'N'}
                      </span>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-neutral-900 truncate'>
                        {`${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
                          'Patient Name'}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {patient.email || patient.phone || 'No contact info'}
                      </p>
                    </div>
                  </div>
                  <div className='text-right' style={{ flexShrink: 0 }}>
                    <p className='text-xs text-neutral-500'>Registered</p>
                    <p className='text-xs font-medium text-neutral-700 mt-1'>
                      {new Date(patient.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-48 text-neutral-400'>
              <svg className='w-16 h-16 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
              <p className='text-sm'>No recent patients</p>
            </div>
          )}
        </Card>
      </div>

      {/* Overdue Invoices & Low Stock Section */}
      <div
        className='grid grid-cols-1 lg:grid-cols-2'
        style={{ gap: '20px', marginBottom: 'var(--space-8)' }}
      >
        {/* Overdue Invoices List */}
        <Card elevated={true} className='border-2 border-status-warning/20'>
          <div
            className='flex items-center justify-between pb-4 mb-6'
            style={{ borderBottom: '2px solid var(--color-neutral-100)' }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-status-warning rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Overdue Invoices
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Pending payments requiring attention
              </p>
            </div>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push('/invoices')}
              className='whitespace-nowrap'
            >
              View All
            </Button>
          </div>

          {loadingLists ? (
            <div className='flex items-center justify-center h-48'>
              <Loader size='md' inline />
            </div>
          ) : overdueInvoices && overdueInvoices.length > 0 ? (
            <div className='space-y-3'>
              {overdueInvoices.map((invoice, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 rounded-lg border border-status-warning/30 bg-status-warning/5 hover:border-status-warning hover:bg-status-warning/10 cursor-pointer transition-all'
                  onClick={() => router.push(`/invoices/${invoice._id || invoice.id}`)}
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className='w-12 h-12 rounded-full bg-status-warning/20 flex items-center justify-center'
                      style={{ flexShrink: 0 }}
                    >
                      <svg
                        className='w-6 h-6 text-status-warning'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-neutral-900 truncate'>
                        {invoice.patientName || `Invoice #${invoice.invoiceNumber || invoice.id}`}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        Due:{' '}
                        {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className='text-right' style={{ flexShrink: 0 }}>
                    <p className='text-sm font-bold text-status-warning'>
                      {formatCurrency(invoice.totalAmount || invoice.amount || 0)}
                    </p>
                    <p className='text-xs text-neutral-500 mt-1'>
                      {Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))}{' '}
                      days overdue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-48 text-neutral-400'>
              <svg className='w-16 h-16 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <p className='text-sm'>No overdue invoices</p>
            </div>
          )}
        </Card>

        {/* Low Stock Items List */}
        <Card elevated={true} className='border-2 border-status-error/20'>
          <div
            className='flex items-center justify-between pb-4 mb-6'
            style={{ borderBottom: '2px solid var(--color-neutral-100)' }}
          >
            <div>
              <div className='flex items-center mb-2' style={{ gap: 'var(--gap-2)' }}>
                <div className='w-2 h-2 bg-status-error rounded-full'></div>
                <h2
                  className='text-neutral-900'
                  style={{
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Low Stock Items
                </h2>
              </div>
              <p
                className='text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                  marginLeft: 'var(--space-4)',
                }}
              >
                Items requiring restock
              </p>
            </div>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push('/inventory')}
              className='whitespace-nowrap'
            >
              View All
            </Button>
          </div>

          {loadingLists ? (
            <div className='flex items-center justify-center h-48'>
              <Loader size='md' inline />
            </div>
          ) : lowStockList && lowStockList.length > 0 ? (
            <div className='space-y-3'>
              {lowStockList.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 rounded-lg border border-status-error/30 bg-status-error/5 hover:border-status-error hover:bg-status-error/10 cursor-pointer transition-all'
                  onClick={() => router.push(`/inventory/items/${item._id || item.id}`)}
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div
                      className='w-12 h-12 rounded-full bg-status-error/20 flex items-center justify-center'
                      style={{ flexShrink: 0 }}
                    >
                      <svg
                        className='w-6 h-6 text-status-error'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-neutral-900 truncate'>
                        {item.name || item.itemName || 'Item Name'}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        SKU: {item.sku || item.code || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className='text-right' style={{ flexShrink: 0 }}>
                    <p className='text-sm font-bold text-status-error'>
                      {item.currentStock || item.quantity || 0} left
                    </p>
                    <p className='text-xs text-neutral-500 mt-1'>
                      Min: {item.minStock || item.minimumQuantity || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-48 text-neutral-400'>
              <svg className='w-16 h-16 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M5 13l4 4L19 7'
                />
              </svg>
              <p className='text-sm'>All items are well-stocked</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions Section */}
      {stats && (
        <Card
          elevated={true}
          className='border-2 border-neutral-100 transition-all duration-300'
          style={{
            marginTop: 'var(--space-10)',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div className='flex items-center mb-3' style={{ gap: 'var(--gap-2)' }}>
              <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
              <h2
                className='text-neutral-900'
                style={{
                  fontSize: '28px',
                  lineHeight: '36px',
                  letterSpacing: '-0.03em',
                  fontWeight: '800',
                }}
              >
                {t('dashboard.quickActions')}
              </h2>
            </div>
            <p
              className='text-neutral-500'
              style={{
                fontSize: 'var(--text-body-md)',
                lineHeight: 'var(--text-body-md-line-height)',
                fontWeight: '400',
                marginLeft: 'var(--space-5)',
              }}
            >
              Common tasks and shortcuts
            </p>
          </div>
          <div
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            style={{ gap: 'var(--gap-6)' }}
          >
            <Button
              variant='primary'
              size='md'
              onClick={() => router.push('/appointments/new')}
              className='w-full'
            >
              <svg
                style={{ width: '20px', height: '20px', marginRight: '8px' }}
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
              {t('dashboard.bookAppointment')}
            </Button>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/patients')}
              className='w-full'
            >
              <svg
                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                />
              </svg>
              {t('dashboard.addPatient')}
            </Button>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/invoices/new')}
              className='w-full'
            >
              <svg
                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              {t('dashboard.createInvoice')}
            </Button>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/reports')}
              className='w-full'
            >
              <svg
                style={{ width: '20px', height: '20px', marginRight: '8px' }}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                />
              </svg>
              {t('dashboard.viewReports')}
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}
