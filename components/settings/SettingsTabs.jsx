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

export function SettingsTabs({ activeTab, setActiveTab, canAccessAdminTabs, actionButtons }) {
  const { t } = useI18n();

  // Define all tabs – adminOnly tabs require Doctor or Clinic Admin (per CursorMD/New permission matrix)
  const allTabs = [
    { id: 'profile', label: t('settings.profile'), icon: <UserIcon className='icon icon-sm' />, adminOnly: false },
    { id: 'general', label: t('settings.clinicInfo'), icon: <Building2Icon className='icon icon-sm' />, adminOnly: true },
    {
      id: 'compliance',
      label: t('settings.compliance'),
      icon: <ShieldIcon className='icon icon-sm' />,
      adminOnly: true,
    },
    { id: 'doctors', label: t('settings.doctorsStaff'), icon: <UsersIcon className='icon icon-sm' />, adminOnly: true },
    { id: 'hours', label: t('settings.clinicHours'), icon: <ClockIcon className='icon icon-sm' />, adminOnly: true },
    { id: 'queue', label: t('settings.queueSettings'), icon: <QueueIcon className='icon icon-sm' />, adminOnly: true },
    { id: 'tax', label: t('settings.taxSettings'), icon: <CurrencyIcon className='icon icon-sm' />, adminOnly: true },
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

  // Filter tabs: Manager has no Settings access (only profile if allowed); Doctor & Clinic Admin see all
  const tabs = allTabs.filter((tab) => !tab.adminOnly || canAccessAdminTabs);

  return (
    <div className='mb-3 flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left'>
      <nav
        className='flex min-w-0 flex-1 items-center justify-start overflow-x-auto gap-1.5 scrollbar-hide'
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-100 text-primary-700 shadow-sm border-l-2 border-primary-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <span className={isActive ? 'text-primary-700' : 'text-neutral-500'}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {actionButtons && (
        <div className='flex items-center gap-2 flex-shrink-0'>
          {actionButtons}
        </div>
      )}
    </div>
  );
}
