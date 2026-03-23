'use client';

/**
 * Renders dashboard tab content by activeTab.
 * Overview = children; KPI/Appointments/Prescriptions rendered here so they stay mounted (fast tab switch).
 * All tabs kept in DOM with display:none when inactive = instant switch, no remount/refetch.
 */
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { memo } from 'react';
import { AppointmentsTab } from '../_tabs/AppointmentsTab';
import { KPIDashboardTab } from '../_tabs/KPIDashboardTab';
import { PrescriptionsTab } from '../_tabs/PrescriptionsTab';

function TabPlaceholder({ tabLabel }) {
  const { t } = useI18n();
  return (
    <div className='dashboard-section dashboard-tab-content'>
      <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
        <p className='text-neutral-600 dark:text-neutral-400 text-center'>
          {t('dashboard.tabPlaceholder', { tab: tabLabel })}
        </p>
      </Card>
    </div>
  );
}

const TabPlaceholderMemo = memo(TabPlaceholder);

function TabErrorFallback({ error, resetErrorBoundary, tabLabel }) {
  const { t } = useI18n();
  return (
    <div className='dashboard-section dashboard-tab-content'>
      <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center items-center'>
        <p className='text-neutral-600 dark:text-neutral-400 text-center mb-4'>
          {t('dashboard.tabError', { tab: tabLabel }) || `${tabLabel} failed to load.`}
        </p>
        <Button variant='primary' size='md' onClick={resetErrorBoundary}>
          {t('common.retry')}
        </Button>
      </Card>
    </div>
  );
}

export const TabContent = memo(function TabContent({ activeTab, children, hidden = false }) {
  const { t } = useI18n();
  const normalizedTab = activeTab || 'overview';

  return (
    <div style={{ display: hidden ? 'none' : undefined }}>
      {/* Overview Tab */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'overview' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'overview'}
      >
        <ErrorBoundary
          variant='card'
          name='OverviewTab'
          fallback={(err, info, reset) => (
            <TabErrorFallback
              error={err}
              resetErrorBoundary={reset}
              tabLabel={t('dashboard.overview')}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      </div>

      {/* KPI Dashboard Tab – same instance, only isActive changes */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'kpi' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'kpi'}
      >
        <ErrorBoundary
          variant='card'
          name='KPIDashboardTab'
          fallback={(err, info, reset) => (
            <TabErrorFallback
              error={err}
              resetErrorBoundary={reset}
              tabLabel={t('dashboard.kpiDashboard')}
            />
          )}
        >
          <KPIDashboardTab isActive={normalizedTab === 'kpi'} />
        </ErrorBoundary>
      </div>

      {/* Appointments Tab – same instance, only isActive changes */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'appointments' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'appointments'}
      >
        <ErrorBoundary
          variant='card'
          name='AppointmentsTab'
          fallback={(err, info, reset) => (
            <TabErrorFallback
              error={err}
              resetErrorBoundary={reset}
              tabLabel={t('appointments.title')}
            />
          )}
        >
          <AppointmentsTab isActive={normalizedTab === 'appointments'} />
        </ErrorBoundary>
      </div>

      {/* Prescriptions Tab – same instance, only isActive changes */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'prescriptions' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'prescriptions'}
      >
        <ErrorBoundary
          variant='card'
          name='PrescriptionsTab'
          fallback={(err, info, reset) => (
            <TabErrorFallback
              error={err}
              resetErrorBoundary={reset}
              tabLabel={t('prescriptions.title')}
            />
          )}
        >
          <PrescriptionsTab isActive={normalizedTab === 'prescriptions'} />
        </ErrorBoundary>
      </div>
    </div>
  );
});
