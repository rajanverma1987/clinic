'use client';

/**
 * Renders dashboard tab content by activeTab (from searchParams).
 * Overview = children; Appointments/Prescriptions = slot content (lazy-loaded) or placeholder.
 * All tab content uses the same dashboard section/card design and theme.
 */
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

function TabPlaceholder({ tabLabel }) {
  const { t } = useI18n();
  return (
    <div className='dashboard-section'>
      <div className='dashboard-card-cell'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
          <p className='text-neutral-600 dark:text-neutral-400 text-center'>
            {t('dashboard.tabPlaceholder', { tab: tabLabel })}
          </p>
        </Card>
      </div>
    </div>
  );
}

export function TabContent({
  activeTab,
  children,
  appointmentsContent = null,
  prescriptionsContent = null,
}) {
  const { t } = useI18n();
  const normalizedTab = activeTab || 'overview';

  if (normalizedTab === 'appointments') {
    return appointmentsContent ?? <TabPlaceholder tabLabel={t('appointments.title')} />;
  }
  if (normalizedTab === 'prescriptions') {
    return prescriptionsContent ?? <TabPlaceholder tabLabel={t('prescriptions.title')} />;
  }

  return children;
}
