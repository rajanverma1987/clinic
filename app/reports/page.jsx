'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [activeTab, setActiveTab] = useState('revenue');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [patientReport, setPatientReport] = useState(null);
  const [appointmentReport, setAppointmentReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (activeTab === 'revenue') {
        fetchRevenueReport();
      } else if (activeTab === 'patients') {
        fetchPatientReport();
      } else if (activeTab === 'appointments') {
        fetchAppointmentReport();
      } else if (activeTab === 'inventory') {
        fetchInventoryReport();
      }
    }
  }, [authLoading, user, startDate, endDate, activeTab]);

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeBreakdown: 'true',
        groupBy: 'day',
      });

      const response = await apiClient.get(`/reports/revenue?${params}`);
      if (response.success && response.data) {
        setRevenueReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeNewPatients: 'true',
        groupBy: 'day',
      });

      const response = await apiClient.get(`/reports/patients?${params}`);
      if (response.success && response.data) {
        setPatientReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupBy: 'day',
        includeNoShows: 'true',
      });

      const response = await apiClient.get(`/reports/appointments?${params}`);
      if (response.success && response.data) {
        setAppointmentReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeLowStock: 'true',
        includeExpired: 'true',
      });

      const response = await apiClient.get(`/reports/inventory?${params}`);
      if (response.success && response.data) {
        setInventoryReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const exportCSV = async (reportType) => {
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        format: 'csv',
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/reports/${reportType}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // Helper function to render bar chart
  const renderBarChart = (data, maxValue, height = 200) => {
    if (!data || data.length === 0) return null;

    const chartData = data.slice(-14);
    const maxBarValue = Math.max(...chartData.map((d) => d.value || d.total || d.count || 0), 1);
    const chartHeight = height;

    return (
      <div className='relative'>
        {/* Y-axis labels */}
        <div className='flex items-end h-[220px] border-b border-l border-neutral-300 pl-8 pr-4 pb-8'>
          {/* Y-axis scale */}
          <div className='absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-neutral-500'>
            {[100, 75, 50, 25, 0].map((percent) => (
              <span key={percent} className='transform -translate-x-full pr-2'>
                {Math.round((maxBarValue * percent) / 100)}
              </span>
            ))}
          </div>

          {/* Bars */}
          <div className='flex-1 flex items-end justify-between gap-1.5'>
            {chartData.map((item, index) => {
              const value = item.value || item.total || item.count || 0;
              const percentage = (value / maxBarValue) * 100;
              const barHeight = (percentage / 100) * chartHeight;

              return (
                <div key={index} className='flex-1 flex flex-col items-center group relative'>
                  {/* Bar */}
                  <div
                    className='w-full bg-primary-500 hover:bg-primary-600 rounded-t cursor-pointer'
                    style={{
                      height: `${Math.max(barHeight, value > 0 ? 2 : 0)}px`,
                      minHeight: value > 0 ? '2px' : '0',
                    }}
                    title={`${new Date(item.period || item.date).toLocaleDateString()}: ${value}`}
                  />

                  {/* Value label on hover */}
                  <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-neutral-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10'>
                    {value}
                  </div>

                  {/* Date label */}
                  <span className='text-xs text-neutral-600 mt-2 text-center leading-tight'>
                    {(() => {
                      const date = new Date(item.period || item.date);
                      // Format based on data density
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

  // Helper function to render pie chart
  const renderPieChart = (data, size = 200) => {
    if (!data || Object.keys(data).length === 0) return null;

    const entries = Object.entries(data);
    const total = entries.reduce(
      (sum, [, value]) => sum + (typeof value === 'number' ? value : 0),
      0
    );
    if (total === 0) return null;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    let currentAngle = 0;

    return (
      <div className='flex items-center justify-center'>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {entries.map(([label, value], index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = size / 2 + (size / 2 - 20) * Math.cos(startAngleRad);
            const y1 = size / 2 + (size / 2 - 20) * Math.sin(startAngleRad);
            const x2 = size / 2 + (size / 2 - 20) * Math.cos(endAngleRad);
            const y2 = size / 2 + (size / 2 - 20) * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${size / 2} ${size / 2}`,
              `L ${x1} ${y1}`,
              `A ${size / 2 - 20} ${size / 2 - 20} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');

            currentAngle += angle;

            return (
              <path
                key={label}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke='white'
                strokeWidth='2'
                className='hover:opacity-80'
              >
                <title>
                  {label}: {typeof value === 'number' ? formatCurrency(value) : value} (
                  {percentage.toFixed(1)}%)
                </title>
              </path>
            );
          })}
        </svg>
        <div className='ml-6 space-y-2'>
          {entries.map(([label, value], index) => {
            const percentage = ((typeof value === 'number' ? value : 0) / total) * 100;
            return (
              <div key={label} className='flex items-center gap-2'>
                <div
                  className='w-4 h-4 rounded'
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className='text-sm text-neutral-600 capitalize'>{label}</span>
                <span className='text-sm font-medium'>
                  {typeof value === 'number' ? formatCurrency(value) : value} (
                  {percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      <DashboardHeader title={t('reports.title')} subtitle={t('reports.description')} />

      <div className='mb-4 flex gap-2 items-end'>
        <div className='flex-1'>
          <label className='block text-xs font-medium text-neutral-700 mb-1'>
            {t('reports.startDate')}
          </label>
          <input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='w-full px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500'
          />
        </div>
        <div className='flex-1'>
          <label className='block text-xs font-medium text-neutral-700 mb-1'>
            {t('reports.endDate')}
          </label>
          <input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className='w-full px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500'
          />
        </div>
        <Button
          onClick={() => {
            if (activeTab === 'revenue') fetchRevenueReport();
            else if (activeTab === 'patients') fetchPatientReport();
            else if (activeTab === 'appointments') fetchAppointmentReport();
            else if (activeTab === 'inventory') fetchInventoryReport();
          }}
          isLoading={loading}
          size='sm'
        >
          {t('reports.generateReport')}
        </Button>
      </div>

      <div className='mb-6 flex gap-2 border-b border-neutral-200'>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'revenue'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {t('reports.revenue')}
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'patients'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {t('reports.patients')}
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'appointments'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {t('reports.appointments')}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'inventory'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {t('reports.inventory')}
        </button>
      </div>

      {activeTab === 'revenue' && revenueReport && (
        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalRevenue')}</p>
                <p className='text-3xl font-bold text-primary-600'>
                  {formatCurrency(revenueReport.summary.totalRevenue)}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>
                  {revenueReport.summary.invoiceCount || 0} {t('reports.invoices')}
                </p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPaid')}</p>
                <p className='text-3xl font-bold text-secondary-600'>
                  {formatCurrency(revenueReport.summary.totalPaid)}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>
                  {revenueReport.summary.paymentCount || 0} {t('reports.payments')}
                </p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPending')}</p>
                <p className='text-3xl font-bold text-status-warning'>
                  {formatCurrency(revenueReport.summary.totalPending)}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.outstanding')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.averageInvoice')}</p>
                <p className='text-3xl font-bold text-primary-700'>
                  {formatCurrency(
                    revenueReport.summary.invoiceCount > 0
                      ? revenueReport.summary.totalRevenue / revenueReport.summary.invoiceCount
                      : 0
                  )}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.perInvoice')}</p>
              </div>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          {revenueReport.timeSeries && revenueReport.timeSeries.length > 0 && (
            <Card>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>{t('reports.revenueTrend')}</h2>
                <Button variant='secondary' size='md' onClick={() => exportCSV('revenue')}>
                  {t('reports.exportToCSV')}
                </Button>
              </div>
              {renderBarChart(
                revenueReport.timeSeries.map((item) => ({ period: item.period, value: item.total }))
              )}
            </Card>
          )}

          {/* Breakdown Charts */}
          {revenueReport.breakdown && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <h3 className='text-lg font-semibold mb-4'>{t('reports.paymentMethods')}</h3>
                {renderPieChart(revenueReport.breakdown.paymentMethods)}
              </Card>

              <Card>
                <h3 className='text-lg font-semibold mb-4'>{t('reports.invoiceStatus')}</h3>
                {renderPieChart(revenueReport.breakdown.statuses)}
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'patients' && patientReport && (
        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPatients')}</p>
                <p className='text-3xl font-bold text-primary-600'>
                  {patientReport.summary.totalPatients || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.allTime')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.newPatients')}</p>
                <p className='text-3xl font-bold text-secondary-600'>
                  {patientReport.summary.newPatients || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.inSelectedPeriod')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.activePatients')}</p>
                <p className='text-3xl font-bold text-primary-700'>
                  {patientReport.summary.activePatients || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.withAppointments')}</p>
              </div>
            </Card>
          </div>

          {/* Patient Growth Chart */}
          {patientReport.monthlyTrend && patientReport.monthlyTrend.length > 0 && (
            <Card>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>{t('reports.patientGrowthOverTime')}</h2>
                <Button variant='secondary' size='md' onClick={() => exportCSV('patients')}>
                  {t('reports.exportToCSV')}
                </Button>
              </div>
              {renderBarChart(
                patientReport.monthlyTrend.map((item) => ({
                  period: item.period,
                  value: item.count,
                }))
              )}
            </Card>
          )}

          {/* Breakdown Charts */}
          {patientReport.breakdown && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {patientReport.breakdown.gender && (
                <Card>
                  <h3 className='text-lg font-semibold mb-4'>{t('reports.byGender')}</h3>
                  {renderPieChart(patientReport.breakdown.gender)}
                </Card>
              )}
              {patientReport.breakdown.ageGroups && (
                <Card>
                  <h3 className='text-lg font-semibold mb-4'>{t('reports.byAgeGroup')}</h3>
                  {renderPieChart(patientReport.breakdown.ageGroups)}
                </Card>
              )}
            </div>
          )}

          {/* Detailed Table */}
          {patientReport.breakdown && (
            <Card>
              <h3 className='text-lg font-semibold mb-4'>{t('reports.patientDemographics')}</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {patientReport.breakdown.bloodGroups &&
                  Object.keys(patientReport.breakdown.bloodGroups).length > 0 && (
                    <div>
                      <h4 className='font-medium mb-2'>{t('reports.bloodGroups')}</h4>
                      <div className='space-y-2'>
                        {Object.entries(patientReport.breakdown.bloodGroups).map(
                          ([group, count]) => (
                            <div
                              key={group}
                              className='flex justify-between items-center p-2 bg-neutral-50 rounded'
                            >
                              <span className='text-neutral-700'>{group}</span>
                              <span className='font-medium'>{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'appointments' && appointmentReport && (
        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalAppointments')}</p>
                <p className='text-3xl font-bold text-primary-600'>
                  {appointmentReport.summary.totalAppointments || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('common.total')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.completed')}</p>
                <p className='text-3xl font-bold text-secondary-600'>
                  {appointmentReport.summary.completed || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>
                  {appointmentReport.summary.totalAppointments > 0
                    ? Math.round(
                        (appointmentReport.summary.completed /
                          appointmentReport.summary.totalAppointments) *
                          100
                      )
                    : 0}
                  % {t('reports.completionRate')}
                </p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('appointments.scheduled')}</p>
                <p className='text-3xl font-bold text-status-warning'>
                  {appointmentReport.summary.scheduled || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.upcoming')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.noShows')}</p>
                <p className='text-3xl font-bold text-status-error'>
                  {appointmentReport.summary.noShows || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>
                  {appointmentReport.summary.totalAppointments > 0
                    ? Math.round(
                        (appointmentReport.summary.noShows /
                          appointmentReport.summary.totalAppointments) *
                          100
                      )
                    : 0}
                  % {t('reports.noShowRate')}
                </p>
              </div>
            </Card>
          </div>

          {/* Appointment Trend Chart */}
          {appointmentReport.timeSeries && appointmentReport.timeSeries.length > 0 && (
            <Card>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold'>{t('reports.appointmentsOverTime')}</h2>
                <Button variant='secondary' size='md' onClick={() => exportCSV('appointments')}>
                  {t('reports.exportToCSV')}
                </Button>
              </div>
              {renderBarChart(
                appointmentReport.timeSeries.map((item) => ({
                  period: item.period,
                  value: item.count,
                }))
              )}
            </Card>
          )}

          {/* Breakdown Charts */}
          {appointmentReport.breakdown && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {appointmentReport.breakdown.statuses && (
                <Card>
                  <h3 className='text-lg font-semibold mb-4'>{t('reports.byStatus')}</h3>
                  {renderPieChart(appointmentReport.breakdown.statuses)}
                </Card>
              )}
              {appointmentReport.breakdown.types && (
                <Card>
                  <h3 className='text-lg font-semibold mb-4'>By Type</h3>
                  {renderPieChart(appointmentReport.breakdown.types)}
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && inventoryReport && (
        <div className='space-y-6'>
          {/* Summary Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalItems')}</p>
                <p className='text-3xl font-bold text-primary-600'>
                  {inventoryReport.summary.totalItems || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.activeItems')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.lowStockItems')}</p>
                <p className='text-3xl font-bold text-status-warning'>
                  {inventoryReport.summary.lowStockCount || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.needReorder')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.expiredItems')}</p>
                <p className='text-3xl font-bold text-status-error'>
                  {inventoryReport.summary.expiredCount || 0}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.expiredBatches')}</p>
              </div>
            </Card>
            <Card>
              <div className='p-4'>
                <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalValue')}</p>
                <p className='text-3xl font-bold text-secondary-600'>
                  {formatCurrency(inventoryReport.summary.totalValue || 0)}
                </p>
                <p className='text-xs text-neutral-500 mt-1'>{t('reports.inventoryValue')}</p>
              </div>
            </Card>
          </div>

          {/* Breakdown Charts */}
          {inventoryReport.breakdown && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {inventoryReport.breakdown.types && (
                <Card>
                  <h3 className='text-lg font-semibold mb-4'>By Type</h3>
                  {renderPieChart(inventoryReport.breakdown.types)}
                </Card>
              )}
            </div>
          )}

          {/* Low Stock Items Table */}
          {inventoryReport.lowStockItems && inventoryReport.lowStockItems.length > 0 && (
            <Card>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold'>Low Stock Items</h3>
                <Button variant='secondary' size='md' onClick={() => exportCSV('inventory')}>
                  {t('reports.exportToCSV')}
                </Button>
              </div>
              <Table
                columns={[
                  { header: t('inventory.itemName'), accessor: 'name' },
                  { header: t('inventory.currentStock'), accessor: (row) => row.currentStock || 0 },
                  {
                    header: t('inventory.lowStockThreshold'),
                    accessor: (row) => row.threshold || 0,
                  },
                  {
                    header: t('common.status'),
                    accessor: (row) => {
                      const stock = row.currentStock || 0;
                      const threshold = row.threshold || 0;
                      if (stock === 0)
                        return (
                          <span className='text-status-error font-medium'>
                            {t('inventory.outOfStock')}
                          </span>
                        );
                      if (stock <= threshold)
                        return (
                          <span className='text-status-warning font-medium'>
                            {t('inventory.lowStock')}
                          </span>
                        );
                      return (
                        <span className='text-secondary-600 font-medium'>
                          {t('inventory.adequate')}
                        </span>
                      );
                    },
                  },
                ]}
                data={inventoryReport.lowStockItems}
              />
            </Card>
          )}

          {/* Expired Items Table */}
          {inventoryReport.expiredItems && inventoryReport.expiredItems.length > 0 && (
            <Card>
              <h3 className='text-lg font-semibold mb-4'>{t('reports.expiredItems')}</h3>
              <Table
                columns={[
                  { header: t('inventory.itemName'), accessor: 'itemName' },
                  { header: t('inventory.batchNumber'), accessor: 'batchNumber' },
                  {
                    header: t('inventory.expiryDate'),
                    accessor: (row) => new Date(row.expiryDate).toLocaleDateString(),
                  },
                  { header: t('inventory.quantity'), accessor: 'quantity' },
                ]}
                data={inventoryReport.expiredItems}
              />
            </Card>
          )}
        </div>
      )}

      {loading && (
        <div className='flex items-center justify-center py-12'>
          <div className='text-neutral-500'>{t('reports.loadingReportData')}</div>
        </div>
      )}

      {!loading && activeTab === 'revenue' && !revenueReport && (
        <Card>
          <p className='text-neutral-600 text-center py-8'>{t('reports.noRevenueData')}</p>
        </Card>
      )}

      {!loading && activeTab === 'patients' && !patientReport && (
        <Card>
          <p className='text-neutral-600 text-center py-8'>{t('reports.noPatientData')}</p>
        </Card>
      )}

      {!loading && activeTab === 'appointments' && !appointmentReport && (
        <Card>
          <p className='text-neutral-600 text-center py-8'>{t('reports.noAppointmentData')}</p>
        </Card>
      )}

      {!loading && activeTab === 'inventory' && !inventoryReport && (
        <Card>
          <p className='text-neutral-600 text-center py-8'>{t('reports.noInventoryData')}</p>
        </Card>
      )}
    </Layout>
  );
}
