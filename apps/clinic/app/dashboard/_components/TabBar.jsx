'use client';

/**
 * Dashboard tab navigation. Updates URL only (no full route); tab content is rendered in-page.
 * Drive by searchParams (?tab=overview|appointments|prescriptions).
 */
import { Tabs } from '@/components/ui/Tabs';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const TAB_IDS = ['overview', 'appointments', 'prescriptions'];

export function TabBar({ className = '' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const activeTab = searchParams?.get('tab') || 'overview';
  const normalizedActive = TAB_IDS.includes(activeTab) ? activeTab : 'overview';

  const switchTab = useCallback(
    (tabId) => {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('dashboard-tab-switch-start');
      }
      const path = tabId === 'overview' ? '/dashboard' : `/dashboard?tab=${tabId}`;
      router.push(path, { scroll: false });
    },
    [router],
  );

  const tabs = [
    { id: 'overview', label: t('dashboard.overview') },
    { id: 'appointments', label: t('appointments.title') },
    { id: 'prescriptions', label: t('prescriptions.title') },
  ];

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={normalizedActive}
        onChange={switchTab}
        idPrefix='dashboard-tab'
        ariaLabel={t('dashboard.tabsLabel')}
      />
    </div>
  );
}
