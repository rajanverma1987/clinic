'use client';

import { CalendarPopup } from '@/components/notifications/CalendarPopup';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export function DashboardHeader({
  title,
  subtitle,
  actionButton,
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  showDate = true,
  dateOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useSettings();
  const [showRightSection, setShowRightSection] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef(null);

  // Show right section after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRightSection(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const formatDateDisplay = useCallback(
    (date, options) => {
      try {
        return new Intl.DateTimeFormat(settings?.settings?.locale || 'en-US', {
          timeZone: settings?.settings?.timezone || 'UTC',
          ...options,
        }).format(date || new Date());
      } catch (error) {
        console.error('Date formatting error:', error);
        return new Date(date || new Date()).toLocaleDateString('en-US', options);
      }
    },
    [settings]
  );

  return (
    <div
      className='bg-white rounded-[10px] border-2 border-neutral-100 relative shadow-lg'
      style={{
        overflow: 'visible',
        padding: '12px 12px 12px 10px',
        background:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 250, 252, 0.98) 100%)',
        zIndex: 'var(--z-sticky-header, 21)',
        position: 'sticky',
        top: 0,
        isolation: 'isolate',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        margin: '0 0 16px 0',
      }}
    >
      {/* Premium Background Pattern */}
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232D9CDB' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div
        className='relative flex flex-col sm:flex-row sm:items-center sm:justify-between'
        style={{
          gap: 'var(--gap-6)',
          position: 'relative',
        }}
      >
        {/* Left Section - Title and Date */}
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            {/* Medical Icon Accent */}
            <div
              style={{
                width: '10px',
                height: '10px',
                background: 'linear-gradient(135deg, #2D9CDB 0%, #56CCF2 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(45, 156, 219, 0.4)',
              }}
            ></div>
            <h1
              className='text-neutral-900'
              style={{
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: '-0.02em',
                fontWeight: '800',
              }}
            >
              {title}
            </h1>
          </div>
          {subtitle ||
            (showDate && (
              <div className='flex items-center gap-2' style={{ marginLeft: '22px' }}>
                <button
                  ref={calendarButtonRef}
                  onClick={() => setShowCalendar(!showCalendar)}
                  className='flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors cursor-pointer group'
                  style={{
                    fontSize: 'var(--text-body-md)',
                    lineHeight: 'var(--text-body-md-line-height)',
                    fontWeight: '500',
                  }}
                  title='View today appointments'
                >
                  <svg
                    width='20px'
                    height='20px'
                    className='text-primary-500 group-hover:text-primary-600 transition-colors'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                  {subtitle || formatDateDisplay(new Date(), dateOptions)}
                </button>
              </div>
            ))}
        </div>

        {/* Right Section - Action Buttons */}
        <div
          className={`flex items-center transition-all duration-500 ${
            showRightSection ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}
          style={{ gap: 'var(--gap-3)' }}
        >
          {/* Language Switcher */}
          <div
            className='bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md'
            style={{
              backdropFilter: 'blur(8px)',
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <LanguageSwitcher variant='light' size='sm' />
          </div>

          {/* Notification Dropdown */}
          <div
            className='bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md'
            style={{
              backdropFilter: 'blur(8px)',
              overflow: 'visible',
              position: 'relative',
            }}
          >
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onNotificationClick={onNotificationClick}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              size='sm'
            />
          </div>

          {/* Action Button */}
          {actionButton}
        </div>
      </div>

      {/* Calendar Popup */}
      <CalendarPopup
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        buttonRef={calendarButtonRef}
      />
    </div>
  );
}
