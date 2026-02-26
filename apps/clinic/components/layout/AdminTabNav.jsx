'use client';

import {
  ADMIN_TABS,
  ADMIN_PRIMARY_TABS,
  isAdminTabActive,
} from '@/lib/constants/admin-tabs';
import { ChevronDownIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

/**
 * Horizontal tab navigation for Super Admin dashboard (15 tabs).
 * Primary tabs in the bar; rest in "More" dropdown for a cleaner single-row look.
 */
export function AdminTabNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const primaryTabs = ADMIN_TABS.slice(0, ADMIN_PRIMARY_TABS);
  const moreTabs = ADMIN_TABS.slice(ADMIN_PRIMARY_TABS);
  const activeInMore = moreTabs.some((tab) => isAdminTabActive(tab, pathname));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const tabLink = (tab, active) => (
    <Link
      key={tab.path}
      href={tab.path}
      role="tab"
      aria-selected={active}
      aria-current={active ? 'page' : undefined}
      prefetch={true}
      scroll={false}
      className={`admin-tab-nav__item rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
        active
          ? 'bg-primary-600 text-white'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
      }`}
    >
      {t(tab.labelKey)}
    </Link>
  );

  return (
    <nav
      role="tablist"
      aria-label={t('admin.superAdminDashboard')}
      className="admin-tab-nav border-b border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 -mx-4 px-4 mb-4"
    >
      <div className="flex flex-nowrap items-center gap-x-1 overflow-x-auto scrollbar-hide py-2 min-h-[2.75rem]">
        {primaryTabs.map((tab) => tabLink(tab, isAdminTabActive(tab, pathname)))}
        {moreTabs.length > 0 && (
          <div className="relative flex-shrink-0" ref={moreRef}>
            <Button
              type="button"
              variant={activeInMore ? 'primary' : 'ghost'}
              size="sm"
              role="tab"
              aria-haspopup="true"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className={`admin-tab-nav__item rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                activeInMore
                  ? ''
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t('admin.tabMore')}
              <ChevronDownIcon
                className={`icon icon-sm transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                ariaHidden
              />
            </Button>
            {moreOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-50 min-w-[180px] py-1 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 shadow-lg"
                role="menu"
              >
                {moreTabs.map((tab) => {
                  const active = isAdminTabActive(tab, pathname);
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      role="menuitem"
                      prefetch={true}
                      scroll={false}
                      onClick={() => setMoreOpen(false)}
                      className={`block px-3 py-2 text-sm font-medium whitespace-nowrap ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {t(tab.labelKey)}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
