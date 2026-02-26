'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { formatLocale } from '@/lib/i18n';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useState } from 'react';

/**
 * Build date string YYYY-MM-DD from Date
 */
function toDateKey(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalendarWidget({ onDateSelect, loading = false, doctorId }) {
  const { t, locale: i18nLocale } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [appointmentCountsByDate, setAppointmentCountsByDate] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const localeStr = formatLocale(i18nLocale);
  const monthName = currentDate.toLocaleDateString(localeStr, { month: 'long' });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Get previous month's days for padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  const daysToShow = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    daysToShow.push({ day: prevMonthDays - i, isCurrentMonth: false, date: null });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    daysToShow.push({
      day,
      isCurrentMonth: true,
      date,
      isToday: date.toDateString() === today.toDateString(),
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - daysToShow.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    daysToShow.push({ day, isCurrentMonth: false, date: null });
  }

  const weekDays = localeStr.startsWith('ar')
    ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
    : localeStr === 'es-ES'
      ? ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateClick = (day, isCurrentMonth, date) => {
    if (isCurrentMonth && date) {
      setSelectedDate(day);
      onDateSelect?.(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Fetch appointment counts for visible month
  const fetchCounts = useCallback(async () => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = toDateKey(start);
    const endStr = toDateKey(end);
    try {
      setCountsLoading(true);
      const params = new URLSearchParams({
        startDate: startStr,
        endDate: endStr,
        limit: '500',
      });
      if (doctorId) params.set('doctorId', doctorId);
      const res = await apiClient.get(`/appointments?${params.toString()}`);
      const list = extractArrayData(res);
      const counts = {};
      for (const apt of list) {
        const dateSource = apt.schedule?.date || apt.appointmentDate || apt.startTime || apt.date;
        const d = dateSource ? new Date(dateSource) : null;
        if (!d || isNaN(d.getTime())) continue;
        const key = toDateKey(d);
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
      setAppointmentCountsByDate(counts);
    } catch (err) {
      logger.error('CalendarWidget: failed to fetch appointment counts', err);
      setAppointmentCountsByDate({});
    } finally {
      setCountsLoading(false);
    }
  }, [year, month, doctorId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  if (loading) {
    return (
      <Card
        className='dashboard-list-card dashboard-list-card-primary calendar-widget-card h-full flex flex-col'
        contentClassName='calendar-widget-card-body'
      >
        <div className='relative z-10 flex-1 flex flex-col min-h-0 calendar-widget-inner'>
          <div className='calendar-widget-header'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-24 flex-1' />
          </div>
          <div className='skeleton flex-1 min-h-[200px] rounded-lg' />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className='dashboard-list-card dashboard-list-card-primary calendar-widget-card'
      contentClassName='calendar-widget-card-body'
    >
      <div className='calendar-widget-inner'>
        {/* Compact header: title + month/year + nav in one tight row */}
        <div className='calendar-widget-header'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='calendar-widget-title'>{t('dashboard.calendar')}</h2>
          <div className='calendar-widget-month-row'>
            <span className='text-neutral-900 dark:text-neutral-100 font-semibold text-xs sm:text-sm'>
              {monthName} {year}
            </span>
            <div className='flex items-center gap-0.5'>
              <Button
                type='button'
                variant='ghost'
                size='xs'
                iconOnly
                onClick={goToPreviousMonth}
                className='calendar-nav-btn min-w-[28px] min-h-[28px]'
                aria-label={t('dashboard.previousMonth')}
              >
                ‹
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='xs'
                iconOnly
                onClick={goToNextMonth}
                className='calendar-nav-btn min-w-[28px] min-h-[28px]'
                aria-label={t('dashboard.nextMonth')}
              >
                ›
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar grid – fills remaining space, no scroll */}
        <div className='calendar-widget'>
          {/* Week days header */}
          <div className='calendar-week-header'>
            {weekDays.map((d) => (
              <span key={d} className='calendar-week-day'>
                {d}
              </span>
            ))}
          </div>
          {/* Days grid – 6 rows × 7 cols, equal cells */}
          <div className='calendar-days-grid'>
            {daysToShow.map(({ day, isCurrentMonth, date, isToday }, index) => {
              const isSelected = isCurrentMonth && day === selectedDate;
              const dateKey = date ? toDateKey(date) : '';
              const count = dateKey ? appointmentCountsByDate[dateKey] || 0 : 0;
              return (
                <Button
                  key={index}
                  type='button'
                  variant='ghost'
                  size='xs'
                  onClick={() => handleDateClick(day, isCurrentMonth, date)}
                  disabled={!isCurrentMonth}
                  className={`calendar-day calendar-day-with-indicator ${!isCurrentMonth ? 'calendar-day-other-month' : ''} ${
                    isToday ? 'calendar-day-today' : ''
                  } ${isSelected ? 'calendar-day-selected' : ''}`}
                  title={
                    count > 0
                      ? (
                          t('dashboard.calendarAppointmentsOnDay') || '{{count}} appointment(s)'
                        ).replace('{{count}}', String(count))
                      : undefined
                  }
                >
                  <span className='calendar-day-num'>{day}</span>
                  {count > 0 && (
                    <span className='calendar-day-indicator' aria-hidden>
                      {count <= 3
                        ? Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                            <span key={i} className='calendar-day-dot' />
                          ))
                        : count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
