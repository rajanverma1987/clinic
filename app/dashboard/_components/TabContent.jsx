'use client';

/**
 * Renders dashboard tab content by activeTab (from searchParams).
 * Overview = children; Appointments/Prescriptions = slot content (lazy-loaded) or placeholder.
 */
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

function TabPlaceholder({ tabLabel }) {
  const { t } = useI18n();
  return (
    <Card className='p-8 text-center'>
      <p className='text-neutral-600 dark:text-neutral-400'>
        {t('dashboard.tabPlaceholder', { tab: tabLabel })}
      </p>
    </Card>
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
