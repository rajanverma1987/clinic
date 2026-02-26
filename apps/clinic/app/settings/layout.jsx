'use client';

import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SETTINGS_CHILDREN } from '@/lib/constants/dashboard-structure';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SettingsPageContent } from './SettingsPageContent';

/** Tab IDs that use the shared SettingsPageContent (no remount on switch = fast). */
const SETTINGS_TAB_CONTENT_IDS = [
  'profile',
  'general',
  'compliance',
  'doctors',
  'hours',
  'queue',
  'tax',
  'smtp',
  'holidays',
  'consent',
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const canAccessSettings = hasPermission(user?.role, RESOURCES.SETTINGS, ACTIONS.READ);
  /** Only clinic_admin and doctor can manage clinic info / compliance / doctors etc.; others must not see those tabs at all. */
  const canManageClinicSettings = user?.role === 'clinic_admin' || user?.role === 'doctor';
  const canAccessAdminTabs = canAccessSettings && canManageClinicSettings;
  // Until auth has loaded, show only non-admin tabs (Profile) to avoid flash of admin tabs
  const visibleTabs = authLoading
    ? SETTINGS_CHILDREN.filter((tab) => !tab.adminOnly)
    : SETTINGS_CHILDREN.filter((tab) => !tab.adminOnly || canManageClinicSettings);

  const activeTabPath = visibleTabs.find(
    (c) => pathname === c.path || (pathname || '').startsWith(c.path + '/'),
  );
  const pageTitle = activeTabPath ? t(activeTabPath.labelKey) : t('settings.title');
  const pageSubtitle = t('settings.description');

  const pathSegment = (pathname || '').replace(/^\/settings\/?/, '').split('/')[0] || '';
  const useSharedTabContent = SETTINGS_TAB_CONTENT_IDS.includes(pathSegment);

  useEffect(() => {
    if (!authLoading && user && !canAccessAdminTabs) {
      if (pathname && pathname !== '/settings/profile' && pathname !== '/settings') {
        const isAdminOnlyPath = SETTINGS_CHILDREN.some(
          (c) => c.adminOnly && (pathname === c.path || pathname.startsWith(c.path + '/')),
        );
        if (isAdminOnlyPath) router.replace('/settings/profile');
      }
    }
  }, [authLoading, user, canAccessAdminTabs, pathname, router]);

  return (
    <Layout title={pageTitle} subtitle={pageSubtitle}>
      <div className='admin-page-content'>
        <nav
          role='tablist'
          aria-label={t('settings.title')}
          className='w-full flex flex-wrap items-center gap-x-4 gap-y-1 overflow-x-auto scrollbar-hide py-1.5 border-b border-neutral-200 dark:border-neutral-600 mb-4'
        >
          {visibleTabs.map(({ path, labelKey }, index) => {
            const normalizedPath = path.replace(/\/$/, '') || '/';
            const normalizedPathname = (pathname || '').replace(/\/$/, '') || '/';
            const isIndex = normalizedPathname === '/settings';
            const isActive =
              normalizedPathname === normalizedPath ||
              (isIndex && index === 1) ||
              (normalizedPathname.startsWith(normalizedPath + '/') &&
                normalizedPath !== '/settings');
            return (
              <Link
                key={path}
                href={path}
                role='tab'
                aria-selected={isActive}
                prefetch={true}
                scroll={false}
                aria-controls='settings-panel'
                id={`settings-tab-${index}`}
                className={
                  isActive
                    ? 'py-1.5 px-3 border-b-2 border-primary-500 text-primary-600 dark:text-primary-300 font-medium text-body-sm whitespace-nowrap transition-colors duration-150'
                    : 'py-1.5 px-3 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 font-medium text-body-sm whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors duration-150'
                }
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div
          id='settings-panel'
          role='tabpanel'
          aria-labelledby={(() => {
            const i = visibleTabs.findIndex(
              (c) => (pathname || '').replace(/\/$/, '') === (c.path || '').replace(/\/$/, ''),
            );
            return i >= 0 ? `settings-tab-${i}` : undefined;
          })()}
        >
          {useSharedTabContent ? <SettingsPageContent /> : children}
        </div>
      </div>
    </Layout>
  );
}
