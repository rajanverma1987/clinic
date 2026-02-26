'use client';

import { CalendarIcon } from '@/components/icons';
import { CalendarPopup } from '@/components/notifications/CalendarPopup';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

export function DashboardHeader({
  title,
  subtitle,
  actionButton,
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
  const { settings, locale } = useSettings();
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef(null);

  const formatDateDisplay = useCallback(
    (date, options) => {
      try {
        return new Intl.DateTimeFormat(locale || 'en-US', {
          timeZone: settings?.settings?.timezone || 'UTC',
          ...options,
        }).format(date || new Date());
      } catch (error) {
        logger.error('Date formatting error:', error);
        return new Date(date || new Date()).toLocaleDateString(undefined, options);
      }
    },
    [settings, locale],
  );

  return (
    <div
      className='bg-white dark:bg-neutral-800 rounded-[10px] border-2 border-neutral-100 dark:border-neutral-600 relative shadow-lg transition-[box-shadow,border-color] duration-200 ease-out'
      style={{
        overflow: 'visible',
        padding: '12px 12px 12px 10px',
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231e4fb5' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
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
                background:
                  'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-300) 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(45, 156, 219, 0.4)',
              }}
            ></div>
            <h1
              className='text-neutral-900 dark:text-neutral-100'
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
                <Button
                  ref={calendarButtonRef}
                  type='button'
                  variant='ghost'
                  onClick={() => setShowCalendar(!showCalendar)}
                  className='flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 group'
                  style={{
                    fontSize: 'var(--text-body-md)',
                    lineHeight: 'var(--text-body-md-line-height)',
                    fontWeight: '500',
                  }}
                  title={t('dashboard.viewTodayAppointments')}
                >
                  <CalendarIcon className='icon icon-sm text-primary-500 group-hover:text-primary-600 transition-colors' />
                  {subtitle || formatDateDisplay(new Date(), dateOptions)}
                </Button>
              </div>
            ))}
        </div>

        {/* Right Section - Action Button */}
        {actionButton && <div className='flex items-center'>{actionButton}</div>}
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
