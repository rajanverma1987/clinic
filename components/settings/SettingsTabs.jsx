'use client';

import {
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  CurrencyIcon,
  MailIcon,
  QueueIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import { useCallback, useRef } from 'react';

const TABLIST_ID_PREFIX = 'settings-tabs';

export function SettingsTabs({ activeTab, setActiveTab, canAccessAdminTabs, actionButtons }) {
  const { t } = useI18n();
  const tabListRef = useRef(null);

  const allTabs = [
    {
      id: 'profile',
      label: t('settings.profile'),
      icon: <UserIcon className='icon icon-sm' />,
      adminOnly: false,
    },
    {
      id: 'general',
      label: t('settings.clinicInfo'),
      icon: <Building2Icon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'compliance',
      label: t('settings.compliance'),
      icon: <ShieldIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'doctors',
      label: t('settings.doctorsStaff'),
      icon: <UsersIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'hours',
      label: t('settings.clinicHours'),
      icon: <ClockIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'queue',
      label: t('settings.queueSettings'),
      icon: <QueueIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'tax',
      label: t('settings.taxSettings'),
      icon: <CurrencyIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'smtp',
      label: t('settings.emailSettings') || 'Email Settings',
      icon: <MailIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    {
      id: 'holidays',
      label: 'Holidays',
      icon: <CalendarIcon className='icon icon-sm' />,
      adminOnly: true,
    },
  ];

  const tabs = allTabs.filter((tab) => !tab.adminOnly || canAccessAdminTabs);
  const tabIds = tabs.map((t) => t.id);
  const currentIndex = tabIds.indexOf(activeTab);

  const handleKeyDown = useCallback(
    (e) => {
      if (!tabListRef.current || tabIds.length === 0) return;
      let nextIndex = currentIndex;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex <= 0 ? tabIds.length - 1 : currentIndex - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex >= tabIds.length - 1 ? 0 : currentIndex + 1;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabIds.length - 1;
          break;
        default:
          return;
      }
      setActiveTab(tabIds[nextIndex]);
      const nextEl = tabListRef.current.querySelector(
        `[id="${TABLIST_ID_PREFIX}-tab-${tabIds[nextIndex]}"]`,
      );
      if (nextEl) nextEl.focus();
    },
    [currentIndex, tabIds, setActiveTab],
  );

  return (
    <div className='mb-3 flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left'>
      <nav
        ref={tabListRef}
        role='tablist'
        aria-label={t('settings.title') || 'Settings'}
        className='flex min-w-0 flex-1 items-center justify-start overflow-x-auto gap-1.5 scrollbar-hide'
        style={{ scrollbarWidth: 'none' }}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type='button'
              key={tab.id}
              id={`${TABLIST_ID_PREFIX}-tab-${tab.id}`}
              role='tab'
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              <span
                className={
                  isActive
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-neutral-500 dark:text-neutral-400'
                }
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {actionButtons && (
        <div className='flex items-center gap-2 flex-shrink-0'>{actionButtons}</div>
      )}
    </div>
  );
}

export function getSettingsTabPanelId(tabId) {
  return `${TABLIST_ID_PREFIX}-panel-${tabId}`;
}

export function getSettingsTabPanelLabelledBy(tabId) {
  return `${TABLIST_ID_PREFIX}-tab-${tabId}`;
}
