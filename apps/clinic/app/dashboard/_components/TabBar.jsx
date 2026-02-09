'use client';

/**
 * Dashboard tab navigation. Updates URL only (no full route); tab content is rendered in-page.
 * Drive by searchParams (?tab=overview|appointments|prescriptions).
 * Optimized with instant state-based switching + URL sync for instant tab switching.
 */
import { Tabs } from '@/components/ui/Tabs';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const TAB_IDS = ['overview', 'appointments', 'prescriptions'];

export function TabBar({ className = '', activeTab, onTabChange }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

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
    { id: 'appointments', label: t('appointments.title') },
    { id: 'prescriptions', label: t('prescriptions.title') },
  ];

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={switchTab}
        idPrefix='dashboard-tab'
        ariaLabel={t('dashboard.tabsLabel')}
      />
    </div>
  );
}
