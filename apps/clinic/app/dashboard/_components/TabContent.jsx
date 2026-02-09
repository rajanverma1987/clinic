'use client';

/**
 * Renders dashboard tab content by activeTab.
 * Overview = children; Appointments/Prescriptions = slot content.
 * All tabs are kept mounted but hidden for instant switching.
 * Memoized to prevent unnecessary re-renders on tab switch.
 */
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { memo } from 'react';

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

export const TabContent = memo(function TabContent({
  activeTab,
  children,
  appointmentsContent = null,
  prescriptionsContent = null,
}) {
  const { t } = useI18n();
  const normalizedTab = activeTab || 'overview';

  // Render all tabs but hide inactive ones for instant switching
  return (
    <>
      {/* Overview Tab */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'overview' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'overview'}
      >
        {children}
      </div>

      {/* Appointments Tab */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'appointments' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'appointments'}
      >
        {appointmentsContent ?? <TabPlaceholderMemo tabLabel={t('appointments.title')} />}
      </div>

      {/* Prescriptions Tab */}
      <div
        className='dashboard-tab-content'
        style={{ display: normalizedTab === 'prescriptions' ? 'block' : 'none' }}
        aria-hidden={normalizedTab !== 'prescriptions'}
      >
        {prescriptionsContent ?? <TabPlaceholderMemo tabLabel={t('prescriptions.title')} />}
      </div>
    </>
  );
});
