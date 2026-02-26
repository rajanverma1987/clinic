'use client';

/**
 * Dashboard tab navigation. Updates URL only (no full route); tab content is rendered in-page.
 * Prefetch on hover for instant display when tab is clicked.
 */
import { Tabs } from '@/components/ui/Tabs';
import { useI18n } from '@/contexts/I18nContext';
import {
  prefetchAppointmentsTab,
  prefetchPrescriptionsTab,
} from '@/lib/dashboard-tab-cache';
import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export function TabBar({ className = '', activeTab, onTabChange, userId }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const appLocale = (locale || 'en').slice(0, 2);

  const switchTab = useCallback(
    (tabId) => {
      if (tabId === activeTab) return; // Already active
      
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('dashboard-tab-switch-start');
      }
      
      // Instant state update via callback for immediate UI feedback
      if (onTabChange) {
        onTabChange(tabId);
      }
      
      // Sync URL in background (non-blocking)
      startTransition(() => {
        const path = tabId === 'overview' ? '/dashboard' : `/dashboard?tab=${tabId}`;
        // Use replace instead of push to avoid adding history entries
        router.replace(path, { scroll: false });
      });
    },
    [activeTab, router, startTransition, onTabChange],
  );

  const tabs = [
    { id: 'overview', label: t('dashboard.overview') },
    { id: 'kpi', label: t('dashboard.kpiDashboard') },
    { id: 'appointments', label: t('appointments.title') },
    { id: 'prescriptions', label: t('prescriptions.title') },
  ];

  const handleTabHover = useCallback(
    (tabId) => {
      if (!userId) return;
      if (tabId === 'appointments') prefetchAppointmentsTab(userId, appLocale);
      else if (tabId === 'prescriptions') prefetchPrescriptionsTab(userId);
    },
    [userId, appLocale],
  );

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={switchTab}
        onTabHover={handleTabHover}
        idPrefix='dashboard-tab'
        ariaLabel={t('dashboard.tabsLabel')}
        variant='dashboard'
      />
    </div>
  );
}
