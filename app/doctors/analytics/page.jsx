'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // day, week, month
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    fetchDoctorId();
  }, [authLoading, user, router]);

  useEffect(() => {
    if (doctorId) {
      fetchAnalytics();
    }
  }, [doctorId, dateRange, startDate, endDate]);

  const fetchDoctorId = async () => {
    try {
      const doctorResponse = await apiClient.get(`/doctors/user/${user._id}`);
      if (doctorResponse.success && doctorResponse.data) {
        setDoctorId(doctorResponse.data._id);
      }
    } catch (err) {
      console.error('Failed to fetch doctor profile:', err);
    }
  };

  const fetchAnalytics = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      const now = new Date();
      let start, end;

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        switch (dateRange) {
          case 'day':
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            start = weekStart;
            end = new Date(now);
            end.setHours(23, 59, 59, 999);
            break;
          case 'month':
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        }
      }

      // Fetch appointments
      const appointmentsResponse = await apiClient.get(
        `/appointments?doctorId=${doctorId}&startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}&limit=1000`
      );

      // Fetch patients
      const patientsResponse = await apiClient.get(`/patients?doctorId=${doctorId}&limit=1000`);

      // Fetch revenue
      const revenueResponse = await apiClient.get(
        `/reports/revenue?doctorId=${doctorId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );

      if (appointmentsResponse.success && patientsResponse.success) {
        const appointments = appointmentsResponse.data || [];
        const patients = patientsResponse.data || [];
        const revenue = revenueResponse.data?.totalRevenue || 0;

        // Calculate demographics
        const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
        const genderCount = { male: 0, female: 0, other: 0 };

        patients.forEach((patient) => {
          if (patient.dateOfBirth) {
            const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
            if (age <= 18) ageGroups['0-18']++;
            else if (age <= 35) ageGroups['19-35']++;
            else if (age <= 50) ageGroups['36-50']++;
            else if (age <= 65) ageGroups['51-65']++;
            else ageGroups['65+']++;
          }
          if (patient.gender) {
            genderCount[patient.gender] = (genderCount[patient.gender] || 0) + 1;
          }
        });

        // Calculate appointment trends
        const appointmentsByDate = {};
        appointments.forEach((apt) => {
          const date = new Date(apt.appointmentDate || apt.startTime).toISOString().split('T')[0];
          appointmentsByDate[date] = (appointmentsByDate[date] || 0) + 1;
        });

        // Calculate status breakdown
        const statusCount = {
          scheduled: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
        };
        appointments.forEach((apt) => {
          if (statusCount.hasOwnProperty(apt.status)) {
            statusCount[apt.status]++;
          }
        });

        setAnalytics({
          totalPatients: patients.length,
          totalAppointments: appointments.length,
          completedAppointments: statusCount.completed,
          cancelledAppointments: statusCount.cancelled,
          revenue,
          ageGroups,
          genderCount,
          appointmentsByDate,
          statusCount,
          completionRate:
            appointments.length > 0
              ? (statusCount.completed / appointments.length) * 100
              : 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => formatCurrencyUtil(amount, currency, locale);

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title='Analytics & Reports'
          subtitle='View your practice performance and patient insights'
        />

        {/* Date Range Selector */}
        <Card>
          <div className='p-4'>
            <div className='flex flex-col md:flex-row gap-4 items-end'>
              <div className='flex gap-2 flex-1'>
                <Button
                  variant={dateRange === 'day' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => {
                    setDateRange('day');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Today
                </Button>
                <Button
                  variant={dateRange === 'week' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => {
                    setDateRange('week');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  This Week
                </Button>
                <Button
                  variant={dateRange === 'month' ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => {
                    setDateRange('month');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  This Month
                </Button>
              </div>
              <div className='flex gap-2'>
                <input
                  type='date'
                  className='px-3 py-2 border border-neutral-300 rounded-lg'
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRange('custom');
                  }}
                  placeholder='Start Date'
                />
                <input
                  type='date'
                  className='px-3 py-2 border border-neutral-300 rounded-lg'
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRange('custom');
                  }}
                  placeholder='End Date'
                />
              </div>
              <Button variant='secondary' size='sm' onClick={() => fetchAnalytics()}>
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-2'>Total Patients</h3>
              <p className='text-3xl font-bold text-neutral-900'>
                {analytics?.totalPatients || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-2'>Total Appointments</h3>
              <p className='text-3xl font-bold text-neutral-900'>
                {analytics?.totalAppointments || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-2'>Completion Rate</h3>
              <p className='text-3xl font-bold text-primary-600'>
                {analytics?.completionRate?.toFixed(1) || 0}%
              </p>
            </div>
          </Card>
          <Card>
            <div className='p-6'>
              <h3 className='text-sm font-medium text-neutral-600 mb-2'>Revenue</h3>
              <p className='text-3xl font-bold text-green-600'>
                {formatCurrency(analytics?.revenue || 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Age Distribution */}
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Patient Age Distribution</h3>
              <div className='space-y-3'>
                {analytics?.ageGroups &&
                  Object.entries(analytics.ageGroups).map(([ageGroup, count]) => {
                    const total = analytics.totalPatients || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={ageGroup}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span className='text-neutral-700'>{ageGroup} years</span>
                          <span className='font-medium text-neutral-900'>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className='w-full bg-neutral-200 rounded-full h-2'>
                          <div
                            className='bg-primary-600 h-2 rounded-full'
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>

          {/* Gender Distribution */}
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Patient Gender Distribution</h3>
              <div className='space-y-3'>
                {analytics?.genderCount &&
                  Object.entries(analytics.genderCount).map(([gender, count]) => {
                    const total = analytics.totalPatients || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={gender}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span className='text-neutral-700 capitalize'>{gender}</span>
                          <span className='font-medium text-neutral-900'>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className='w-full bg-neutral-200 rounded-full h-2'>
                          <div
                            className='bg-primary-600 h-2 rounded-full'
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>

          {/* Appointment Status */}
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Appointment Status</h3>
              <div className='space-y-3'>
                {analytics?.statusCount &&
                  Object.entries(analytics.statusCount).map(([status, count]) => {
                    const total = analytics.totalAppointments || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={status}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span className='text-neutral-700 capitalize'>{status.replace('_', ' ')}</span>
                          <span className='font-medium text-neutral-900'>
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className='w-full bg-neutral-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full ${
                              status === 'completed'
                                ? 'bg-green-600'
                                : status === 'cancelled'
                                ? 'bg-red-600'
                                : 'bg-primary-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>

          {/* Appointment Trends */}
          <Card>
            <div className='p-6'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>Appointment Trends</h3>
              <div className='space-y-2'>
                {analytics?.appointmentsByDate &&
                  Object.entries(analytics.appointmentsByDate)
                    .slice(-7)
                    .map(([date, count]) => {
                      const maxCount = Math.max(
                        ...Object.values(analytics.appointmentsByDate)
                      );
                      const height = (count / maxCount) * 100;
                      return (
                        <div key={date} className='flex items-end gap-2'>
                          <div className='flex-1'>
                            <div
                              className='bg-primary-600 rounded-t'
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                          </div>
                          <div className='text-xs text-neutral-600 w-20 text-right'>
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className='text-xs font-medium text-neutral-900 w-8'>{count}</div>
                        </div>
                      );
                    })}
              </div>
            </div>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <div className='p-6'>
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>Export Reports</h3>
            <div className='flex gap-4'>
              <Button
                variant='secondary'
                onClick={() => {
                  if (typeof window !== 'undefined' && analytics) {
                    const { exportAnalyticsToCSV } = require('@/lib/utils/export-utils');
                    const csv = exportAnalyticsToCSV(analytics, dateRange);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `analytics-${dateRange}-${Date.now()}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              >
                Export as CSV
              </Button>
              <Button
                variant='secondary'
                onClick={() => {
                  if (typeof window !== 'undefined' && analytics) {
                    const { exportAnalyticsToCSV } = require('@/lib/utils/export-utils');
                    const csv = exportAnalyticsToCSV(analytics, dateRange);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `analytics-${dateRange}-${Date.now()}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              >
                Export as Excel
              </Button>
              <Button
                variant='secondary'
                onClick={() => {
                  if (typeof window !== 'undefined' && analytics) {
                    const { generateAnalyticsPDFHTML } = require('@/lib/utils/export-utils');
                    const html = generateAnalyticsPDFHTML(analytics, dateRange);
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(html);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }
                }}
              >
                Export as PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
