'use client';

import { Card } from '@/components/ui/Card';
import { useState } from 'react';

export function CalendarWidget({ onDateSelect, loading = false }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });

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

  const weekDays = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

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

  if (loading) {
    return (
      <Card className='dashboard-list-card dashboard-list-card-primary calendar-widget-card h-full flex flex-col'>
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
    <Card className='dashboard-list-card dashboard-list-card-primary calendar-widget-card'>
      <div className='calendar-widget-inner'>
        {/* Compact header: title + month/year + nav in one tight row */}
        <div className='calendar-widget-header'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='calendar-widget-title'>Calendar</h2>
          <div className='calendar-widget-month-row'>
            <span className='text-neutral-900 font-semibold text-xs sm:text-sm'>
              {monthName} {year}
            </span>
            <div className='flex items-center gap-0.5'>
              <button
                type='button'
                onClick={goToPreviousMonth}
                className='calendar-nav-btn'
                aria-label='Previous month'
              >
                ‹
              </button>
              <button
                type='button'
                onClick={goToNextMonth}
                className='calendar-nav-btn'
                aria-label='Next month'
              >
                ›
              </button>
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
              return (
                <button
                  key={index}
                  type='button'
                  onClick={() => handleDateClick(day, isCurrentMonth, date)}
                  className={`calendar-day ${!isCurrentMonth ? 'calendar-day-other-month' : ''} ${
                    isToday ? 'calendar-day-today' : ''
                  } ${isSelected ? 'calendar-day-selected' : ''}`}
                  disabled={!isCurrentMonth}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
