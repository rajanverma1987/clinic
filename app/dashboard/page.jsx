'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Dashboard components
import { AppointmentListItem } from './components/AppointmentListItem';
import { ChartCard } from './components/ChartCard';
import { CriticalAlerts } from './components/CriticalAlerts';
import { DashboardListCard } from './components/DashboardListCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { InventoryListItem } from './components/InventoryListItem';
import { InvoiceListItem } from './components/InvoiceListItem';
import { LotListItem } from './components/LotListItem';
import { PatientListItem } from './components/PatientListItem';
import { PrescriptionListItem } from './components/PrescriptionListItem';
import { QuickActions } from './components/QuickActions';
import { StatsCard } from './components/StatsCard';

// Custom hooks
import { useDashboardCharts } from './hooks/useDashboardCharts';
import { useDashboardLists } from './hooks/useDashboardLists';
import { useDashboardStats } from './hooks/useDashboardStats';

// Import dashboard styles
import './styles/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();

  // Custom hooks for data fetching
  const { stats, loading: statsLoading, fetchStats } = useDashboardStats();
  const { chartData, loading: chartsLoading, fetchChartData } = useDashboardCharts();
  const {
    todayAppointments,
    recentPatients,
    overdueInvoices,
    lowStockList,
    prescriptionRefills,
    queueStatus,
    criticalAlerts,
    expiringLots,
    loading: listsLoading,
    fetchDashboardLists,
  } = useDashboardLists();

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

  // Fetch all data on mount
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const timer = setTimeout(() => router.push('/login'), 100);
      return () => clearTimeout(timer);
    }

    // Redirect super admin to admin dashboard
    if (user && user.role === 'super_admin') {
      router.push('/admin');
      return;
    }

    // Fetch data when user is available
    if (user) {
      fetchStats();
      fetchChartData();
      fetchDashboardLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]); // Functions are stable from useCallback hooks

  // Loading states
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
          <Loader size='lg' text='Redirecting to login...' />
        </div>
      </Layout>
    );
  }

  // Show skeleton when initial data is loading
  const isInitialLoading = statsLoading || chartsLoading || listsLoading;

  if (isInitialLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        {/* Dashboard Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <DashboardHeader
            title='Dashboard Overview'
            subtitle={formatDateDisplay()}
          />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <QuickActions onNavigate={(path) => router.push(path)} loading={false} />
        </div>

        {/* Critical Alerts */}
        {criticalAlerts && criticalAlerts.length > 0 && (
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <CriticalAlerts alerts={criticalAlerts} />
          </div>
        )}

        {/* Key Statistics Cards */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            style={{ gap: 'var(--gap-4)' }}
          >
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
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue || 0)}
              trend={stats?.revenueTrend}
              icon='revenue'
              colorScheme='secondary'
              onClick={() => router.push('/reports')}
              loading={statsLoading}
            />
            <StatsCard
              title='Active Patients'
              value={stats?.activePatients || 0}
              trend={stats?.patientsTrend}
              icon='patients'
              colorScheme='primary'
              onClick={() => router.push('/patients')}
              loading={statsLoading}
            />
            <StatsCard
              title='New Patients (This Month)'
              value={stats?.newPatientsThisMonth || 0}
              trend={stats?.newPatientsTrend}
              icon='patients'
              colorScheme='secondary'
              onClick={() => router.push('/patients')}
              loading={statsLoading}
            />
            <StatsCard
              title='Completed Today'
              value={stats?.completedToday || 0}
              trend={stats?.completionTrend}
              icon='calendar'
              colorScheme='primary'
              onClick={() => router.push('/appointments')}
              loading={statsLoading}
            />
            <StatsCard
              title='Pending Invoices'
              value={stats?.pendingInvoices || 0}
              trend={stats?.invoicesTrend}
              icon='invoice'
              colorScheme='warning'
              onClick={() => router.push('/invoices')}
              loading={statsLoading}
            />
            <StatsCard
              title='Low Stock Items'
              value={lowStockList?.length || 0}
              icon='inventory'
              colorScheme='error'
              onClick={() => router.push('/inventory')}
              loading={listsLoading}
            />
            <StatsCard
              title='Queue Status'
              value={queueStatus?.active || 0}
              icon='queue'
              colorScheme='primary'
              onClick={() => router.push('/queue')}
              loading={listsLoading}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
            <ChartCard
              title='Revenue Trend (Last 14 Days)'
              data={chartData.revenue}
              colorScheme='secondary'
              loading={chartsLoading}
            />
            <ChartCard
              title='Appointment Trend (Last 14 Days)'
              data={chartData.appointments}
              colorScheme='primary'
              loading={chartsLoading}
            />
          </div>
        </div>

        {/* Lists Section - 3 columns */}
        <div
          className='grid grid-cols-1 lg:grid-cols-3'
          style={{ gap: 'var(--gap-6)', marginBottom: 'var(--space-10)' }}
        >
          {/* Today's Appointments */}
          <DashboardListCard
            title="Today's Appointments"
            data={todayAppointments}
            loading={listsLoading}
            colorScheme='primary'
            emptyMessage='No appointments scheduled for today'
            renderItem={(appointment) => (
              <AppointmentListItem
                key={appointment._id || appointment.id}
                appointment={appointment}
                onClick={() => router.push(`/appointments/${appointment._id || appointment.id}`)}
              />
            )}
          />

          {/* Recent Patients */}
          <DashboardListCard
            title='Recent Patients'
            data={recentPatients}
            loading={listsLoading}
            colorScheme='secondary'
            emptyMessage='No recent patients'
            renderItem={(patient) => (
              <PatientListItem
                key={patient._id || patient.id}
                patient={patient}
                onClick={() => router.push(`/patients/${patient._id || patient.id}`)}
              />
            )}
          />

          {/* Prescription Refills */}
          <DashboardListCard
            title='Active Prescriptions'
            data={prescriptionRefills}
            loading={listsLoading}
            colorScheme='primary'
            emptyMessage='No active prescriptions'
            renderItem={(prescription) => (
              <PrescriptionListItem
                key={prescription._id || prescription.id}
                prescription={prescription}
                onClick={() => router.push(`/prescriptions/${prescription._id || prescription.id}`)}
              />
            )}
          />
        </div>

        {/* Second Row Lists - 2 columns */}
        <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
          {/* Overdue Invoices */}
          <DashboardListCard
            title='Overdue Invoices'
            data={overdueInvoices}
            loading={listsLoading}
            colorScheme='warning'
            emptyMessage='No overdue invoices'
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
            title='Low Stock Items'
            data={lowStockList}
            loading={listsLoading}
            colorScheme='error'
            emptyMessage='All items are well stocked'
            renderItem={(item) => (
              <InventoryListItem
                key={item._id || item.id}
                item={item}
                onClick={() => router.push(`/inventory/items/${item._id || item.id}`)}
              />
            )}
          />
        </div>

        {/* Expiring Lots Section */}
        {expiringLots && expiringLots.length > 0 && (
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <DashboardListCard
              title='Expiring Lots (Next 30 Days)'
              data={expiringLots}
              loading={listsLoading}
              colorScheme='warning'
              emptyMessage='No lots expiring soon'
              renderItem={(lot) => (
                <LotListItem
                  key={lot._id || lot.batchNumber}
                  lot={lot}
                  onClick={() => router.push(`/inventory/lots`)}
                />
              )}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
