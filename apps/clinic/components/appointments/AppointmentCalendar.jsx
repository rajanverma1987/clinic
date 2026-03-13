'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { dateAtTimeInTimezone } from '@/lib/utils/date-timezone';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger.js';
import { useCallback, useEffect, useState } from 'react';

/**
 * Compact calendar component showing available appointment slots for a selected date
 * Displays time slots for a single day with availability
 */
export default function AppointmentCalendar({
  selectedDoctorId,
  selectedDate,
  onDateChange,
  onSlotSelect,
  settings,
}) {
  const { t } = useI18n();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Default working hours (9 AM to 5 PM)
  const defaultStartHour = 9;
  const defaultEndHour = 17;
  // Get slot duration from Queue Settings (Average Consultation Time), default to 30 minutes
  const slotDuration = settings?.queueSettings?.averageConsultationTime || 30; // minutes
  // Skeleton count to match actual slots: (end - start) hours * 60 / duration
  const skeletonSlotCount = Math.ceil(((defaultEndHour - defaultStartHour) * 60) / slotDuration);

  /** YYYY-MM-DD in local time — use for date input value/min so the calendar shows the correct day. */
  const formatDateLocal = useCallback((date) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      const fallback = new Date();
      date = fallback;
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const formatDateForApi = useCallback(
    (date) => {
      if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return formatDateLocal(new Date());
      }
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: settings?.timezone || 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
      } catch {
        return formatDateLocal(date);
      }
    },
    [settings?.timezone, formatDateLocal],
  );

  const formatDateDisplay = useCallback(
    (date) => {
      try {
        return new Intl.DateTimeFormat(settings?.locale || 'en-US', {
          timeZone: settings?.timezone || 'UTC',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      } catch {
        return date.toLocaleDateString();
      }
    },
    [settings?.locale, settings?.timezone],
  );

  /** Format date for the label at end of date filter: use local calendar day so it matches the date input (no timezone shift). */
  const formatDateDisplayLocal = useCallback((date) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(settings?.locale || 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      const y = date.getFullYear();
      const m = date.toLocaleDateString(undefined, { month: 'short' });
      const d = date.getDate();
      const w = date.toLocaleDateString(undefined, { weekday: 'short' });
      return `${w}, ${m} ${d}, ${y}`;
    }
  }, [settings?.locale]);

  const formatTimeDisplay = useCallback(
    (date) => {
      try {
        return new Intl.DateTimeFormat(settings?.locale || 'en-US', {
          timeZone: settings?.timezone || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(date);
      } catch {
        return date.toLocaleTimeString();
      }
    },
    [settings?.locale, settings?.timezone],
  );

  // Update currentDate when selectedDate prop changes (parse YYYY-MM-DD as local date to avoid UTC-offset)
  useEffect(() => {
    if (!selectedDate) return;
    if (typeof selectedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (!Number.isNaN(date.getTime())) setCurrentDate(date);
      return;
    }
    const date = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    if (!Number.isNaN(date.getTime())) setCurrentDate(date);
  }, [selectedDate]);

  // Generate time slots in clinic timezone so booked-slot matching is correct
  const generateTimeSlots = useCallback(
    (dateStr, timezone) => {
      const tz = timezone || 'UTC';
      const slots = [];
      const totalMinutes = (defaultEndHour - defaultStartHour) * 60;
      const slotCount = Math.floor(totalMinutes / slotDuration);

      for (let i = 0; i < slotCount; i++) {
        const startMinutes = defaultStartHour * 60 + i * slotDuration;
        const endMinutes = startMinutes + slotDuration;
        const startHour = Math.floor(startMinutes / 60);
        const startMin = startMinutes % 60;
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;

        const start = dateAtTimeInTimezone(dateStr, startHour, startMin, tz);
        const end = dateAtTimeInTimezone(dateStr, endHour, endMin, tz);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

        slots.push({
          start,
          end,
          available: false,
          booked: false,
        });
      }
      return slots;
    },
    [defaultStartHour, defaultEndHour, slotDuration],
  );

  // Fetch appointments for the selected date to determine availability.
  // Use the calendar day the user selected (local YYYY-MM-DD), not clinic-TZ conversion, so the
  // same date/time they book shows as booked on that same date in the calendar.
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const dateKey = formatDateLocal(currentDate);
      const clinicTimezone =
        settings?.timezone ||
        (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null) ||
        'UTC';

      const params = new URLSearchParams({ date: dateKey, limit: '500' });
      if (clinicTimezone) params.set('timezone', clinicTimezone);
      if (selectedDoctorId) params.set('doctorId', selectedDoctorId);
      params.set('_', String(Date.now())); // avoid stale cache so booked slots show after creating
      const response = await apiClient.get(`/appointments?${params.toString()}`);

      if (response.success && response.data) {
        const appointmentsData = extractArrayData(response);
        // Filter appointments to only include active statuses (compare lowercase; API may return mixed case)
        const activeStatuses = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'in_queue'];
        const appointments = appointmentsData.filter((apt) => {
          const status = (apt.status && String(apt.status).toLowerCase()) || '';
          const hasStart = !!(apt.startTime || apt.schedule?.startTime);
          return activeStatuses.includes(status) && hasStart;
        });

        const slots = generateTimeSlots(dateKey, clinicTimezone);

        // Initialize all slots as available first
        slots.forEach((slot) => {
          slot.available = true;
          slot.booked = false;
        });

        // Mark slot as booked if any appointment overlaps (use schedule fallback; all times UTC)
        appointments.forEach((apt) => {
          const rawStart = apt.startTime ?? apt.schedule?.startTime;
          const rawEnd = apt.endTime ?? apt.schedule?.endTime;
          const aptStart = rawStart ? new Date(rawStart) : null;
          if (!aptStart || Number.isNaN(aptStart.getTime())) return;

          let aptEnd = rawEnd ? new Date(rawEnd) : null;
          if (!aptEnd || Number.isNaN(aptEnd.getTime())) {
            const durationMin = apt.duration ?? apt.schedule?.duration ?? slotDuration;
            aptEnd = new Date(aptStart.getTime() + durationMin * 60 * 1000);
          }

          const aptEndMs = aptEnd.getTime();
          slots.forEach((slot) => {
            const slotStartMs = slot.start.getTime();
            const slotEndMs = slot.end.getTime();
            const aptStartMs = aptStart.getTime();
            // Mark booked if appointment overlaps this slot (so 9:00–9:30 books both 9:00 and 9:15 in 15-min slots)
            const overlaps = aptStartMs < slotEndMs && aptEndMs > slotStartMs;
            if (overlaps) {
              slot.available = false;
              slot.booked = true;
            }
          });
        });

        // Past slot detection: use clinic timezone so "today" and "past day" match clinic 9–5
        const now = new Date();
        const todayKey = formatDateLocal(new Date());
        const isTodayInClinic = dateKey === todayKey;
        const isPastDayInClinic = dateKey < todayKey;
        const oneMinuteMs = 60 * 1000;

        // Format slots: get display hour/minute in clinic TZ; keep start/end as UTC Dates
        const formattedSlots = slots.map((slot) => {
          const slotHour = parseInt(
            new Intl.DateTimeFormat('en-US', { timeZone: clinicTimezone, hour: 'numeric', hour12: false }).format(slot.start),
            10,
          );
          const slotMinute = parseInt(
            new Intl.DateTimeFormat('en-US', { timeZone: clinicTimezone, minute: 'numeric' }).format(slot.start),
            10,
          );

          // Past if: selected date is before today (clinic), or today and slot start has passed (slot.end so slot is fully in past)
          const isPastSlot =
            isPastDayInClinic || (isTodayInClinic && slot.end.getTime() - oneMinuteMs < now.getTime());

          const isBooked = slot.booked === true;
          const isAvailable = slot.available === true && !isBooked && !isPastSlot;

          return {
            ...slot,
            start: slot.start,
            end: slot.end,
            date: new Date(currentDate),
            dateKey: dateKey,
            hour: slotHour,
            minute: slotMinute,
            available: isAvailable,
            booked: isBooked,
            isPast: isPastSlot,
          };
        });

        setAvailableSlots(formattedSlots);
      } else {
        const clinicTz =
          settings?.timezone ||
          (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null) ||
          'UTC';
        const slots = generateTimeSlots(dateKey, clinicTz);

        const now = new Date();
        const todayKeyElse = formatDateLocal(new Date());
        const isTodayInClinic = dateKey === todayKeyElse;
        const isPastDayInClinic = dateKey < todayKeyElse;
        const oneMinuteMs = 60 * 1000;

        const formattedSlots = slots.map((slot) => {
          const slotHour = parseInt(
            new Intl.DateTimeFormat('en-US', { timeZone: clinicTz, hour: 'numeric', hour12: false }).format(slot.start),
            10,
          );
          const slotMinute = parseInt(
            new Intl.DateTimeFormat('en-US', { timeZone: clinicTz, minute: 'numeric' }).format(slot.start),
            10,
          );
          const isPastSlot =
            isPastDayInClinic || (isTodayInClinic && slot.end.getTime() - oneMinuteMs < now.getTime());

          return {
            ...slot,
            date: new Date(currentDate),
            dateKey: dateKey,
            hour: slotHour,
            minute: slotMinute,
            available: !isPastSlot,
            booked: false,
            isPast: isPastSlot,
          };
        });
        setAvailableSlots(formattedSlots);
      }
    } catch (error) {
      logger.error('Failed to fetch availability:', error);
      const clinicTz =
        settings?.timezone ||
        (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null) ||
        'UTC';
      const dateKeyFallback = formatDateLocal(currentDate);
      const slots = generateTimeSlots(dateKeyFallback, clinicTz);

      const now = new Date();
      const todayKeyCatch = formatDateLocal(new Date());
      const isTodayInClinic = dateKeyFallback === todayKeyCatch;
      const isPastDayInClinic = dateKeyFallback < todayKeyCatch;
      const oneMinuteMs = 60 * 1000;

      const formattedSlots = slots.map((slot) => {
        const slotHour = parseInt(
          new Intl.DateTimeFormat('en-US', { timeZone: clinicTz, hour: 'numeric', hour12: false }).format(slot.start),
          10,
        );
        const slotMinute = parseInt(
          new Intl.DateTimeFormat('en-US', { timeZone: clinicTz, minute: 'numeric' }).format(slot.start),
          10,
        );
        const isPastSlot =
          isPastDayInClinic || (isTodayInClinic && slot.end.getTime() - oneMinuteMs < now.getTime());

        return {
          ...slot,
          date: new Date(currentDate),
          dateKey: dateKeyFallback,
          hour: slotHour,
          minute: slotMinute,
          available: !isPastSlot,
          booked: slot.booked === true,
          isPast: isPastSlot,
        };
      });
      setAvailableSlots(formattedSlots);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, currentDate, formatDateLocal, settings, generateTimeSlots]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // When viewing "today", re-compute past slots every minute so passed times become unavailable
  useEffect(() => {
    const todayKey = formatDateLocal(new Date());
    const selectedKey = formatDateLocal(currentDate);
    const viewingToday = todayKey === selectedKey;
    if (!viewingToday || availableSlots.length === 0) return;

    const oneMinuteMs = 60 * 1000;
    const updatePastSlots = () => {
      const now = Date.now();
      setAvailableSlots((prev) =>
        prev.map((slot) => {
          const isPastDayInClinic = slot.dateKey < todayKey;
          const isTodayInClinic = slot.dateKey === todayKey;
          const isPastSlot =
            isPastDayInClinic || (isTodayInClinic && slot.end.getTime() - oneMinuteMs < now);
          return {
            ...slot,
            isPast: isPastSlot,
            available: !slot.booked && !isPastSlot,
          };
        }),
      );
    };

    updatePastSlots();
    const intervalId = setInterval(updatePastSlots, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentDate, formatDateLocal, availableSlots.length]);

  const handleSlotClick = (slot) => {
    if (slot.available && !slot.booked && !slot.isPast) {
      setSelectedSlot(slot);
      if (onSlotSelect) {
        const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
        onSlotSelect({
          date: slot.date,
          startTime: slot.start,
          endTime: slot.end,
          time: timeStr,
        });
      }
    }
  };

  const notifyDateChange = useCallback(
    (date) => {
      if (onDateChange && date && !Number.isNaN(date.getTime())) {
        onDateChange(date);
      }
    },
    [onDateChange],
  );

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value) {
      const today = new Date();
      setCurrentDate(today);
      setSelectedSlot(null);
      notifyDateChange(today);
      return;
    }
    const [y, m, d] = value.split('-').map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return;
    const newDate = new Date(y, m - 1, d);
    if (Number.isNaN(newDate.getTime())) return;
    setCurrentDate(newDate);
    setSelectedSlot(null);
    notifyDateChange(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedSlot(null);
    notifyDateChange(today);
  };

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    setSelectedSlot(null);
    notifyDateChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
    setSelectedSlot(null);
    notifyDateChange(next);
  };

  // Check if current date is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDay = new Date(currentDate);
  selectedDay.setHours(0, 0, 0, 0);
  const isToday = selectedDay.getTime() === today.getTime();
  const isPast = selectedDay < today;

  return (
    <Card className='p-4 dark:bg-neutral-800 dark:border-neutral-600'>
      <div className='flex items-center justify-between mb-5'>
        <h3 className='text-lg font-semibold text-neutral-900 dark:text-white'>
          {t('appointments.availabilityCalendar') || 'Availability Calendar'}
        </h3>
      </div>

      {
        <>
          {/* Date Selector */}
          <div className='mb-5 mt-1 flex items-center gap-2 flex-wrap'>
            <Button
              variant='secondary'
              size='lg'
              iconOnly
              onClick={goToPreviousDay}
              title={t('appointments.previousDay') || 'Previous Day'}
              aria-label={t('appointments.previousDay') || 'Previous Day'}
            >
              ←
            </Button>
            <input
              type='date'
              value={formatDateLocal(currentDate)}
              onChange={handleDateChange}
              min={formatDateLocal(today)}
              className='px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-500 dark:bg-neutral-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-neutral-400'
            />
            <Button
              variant='primary'
              size='lg'
              iconOnly
              onClick={goToNextDay}
              title={t('appointments.nextDay') || 'Next Day'}
              aria-label={t('appointments.nextDay') || 'Next Day'}
            >
              →
            </Button>
            {!isToday && (
              <Button variant='secondary' size='xs' onClick={goToToday}>
                {t('appointments.today') || 'Today'}
              </Button>
            )}
            <div className='ml-auto text-sm text-neutral-600 dark:text-neutral-300'>{formatDateDisplayLocal(currentDate)}</div>
          </div>

          {loading ? (
            <div
              className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-hidden mt-1'
              aria-busy='true'
              aria-label={t('appointments.loadingSlots')}
            >
              {Array.from({ length: skeletonSlotCount }, (_, i) => (
                <div
                  key={i}
                  className='min-h-[2.5rem] rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-700 animate-pulse'
                />
              ))}
            </div>
          ) : (
            <>
              {/* Time Slots Grid */}
              <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto mt-1'>
                {availableSlots.map((slot, idx) => {
                  const slotHour = slot.hour;
                  const slotMinute = slot.minute;
                  const timeStr = `${slotHour.toString().padStart(2, '0')}:${slotMinute
                    .toString()
                    .padStart(2, '0')}`;

                  // Explicitly check booked status and past slot status
                  const isBooked = slot?.booked === true;
                  const isPastSlot = slot?.isPast === true;
                  const isAvailable = slot ? slot.available && !isBooked && !isPastSlot : false;
                  const isSelected =
                    selectedSlot &&
                    selectedSlot.dateKey === slot.dateKey &&
                    selectedSlot.hour === slotHour &&
                    selectedSlot.minute === slotMinute;

                  // Determine slot state and color class
                  // Priority: selected > booked > past > available > unavailable
                  let slotClass = '';
                  let slotTitle = '';
                  let slotIcon = '○';

                  if (isSelected && !isBooked && !isPastSlot) {
                    slotClass = 'bg-primary-600 text-white border-primary-600 cursor-pointer';
                    slotTitle = `${timeStr} - ${t('appointments.available') || 'Available'} (${
                      t('appointments.selected') || 'Selected'
                    })`;
                    slotIcon = '✓';
                  } else if (isBooked) {
                    // Booked slots should always be red/orange and disabled
                    slotClass =
                      'bg-status-warning/20 text-status-warning border-status-warning/40 cursor-not-allowed opacity-90';
                    slotTitle = `${timeStr} - ${t('appointments.booked') || 'Booked'}`;
                    slotIcon = '●';
                  } else if (isPastSlot) {
                    slotClass =
                      'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed';
                    slotTitle = `${timeStr} - ${t('appointments.past') || 'Past'}`;
                    slotIcon = '—';
                  } else if (isAvailable) {
                    slotClass =
                      'bg-secondary-100 text-secondary-700 border-secondary-300 hover:bg-secondary-100 cursor-pointer';
                    slotTitle = `${timeStr} - ${t('appointments.available') || 'Available'}`;
                    slotIcon = '○';
                  } else {
                    slotClass = 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
                    slotTitle = `${timeStr} - ${t('appointments.unavailable') || 'Unavailable'}`;
                    slotIcon = '—';
                  }

                  return (
                    <Button
                      key={idx}
                      type='button'
                      variant='ghost'
                      size='xs'
                      onClick={() => handleSlotClick(slot)}
                      disabled={isBooked || !isAvailable || isPastSlot}
                      className={`py-3 px-4 text-xs rounded border font-medium min-h-[3.25rem] ${slotClass}`}
                      title={slotTitle}
                      aria-label={slotTitle}
                    >
                      <div className='flex flex-col items-center dark:[&_span]:text-white'>
                        <span className='text-xs font-semibold'>{timeStr}</span>
                        <span className='text-base mt-0.5'>{slotIcon}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className='mt-4 flex items-center justify-center gap-4 text-xs flex-wrap'>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 bg-green-50 border border-green-300 dark:bg-green-500/40 dark:border-green-400 rounded'></div>
                  <span className='text-neutral-600 dark:text-neutral-300'>
                    {t('appointments.available') || 'Available'}
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 bg-status-warning/20 border border-status-warning/40 dark:bg-amber-500/40 dark:border-amber-400 rounded'></div>
                  <span className='text-neutral-600 dark:text-neutral-300'>{t('appointments.booked') || 'Booked'}</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 bg-gray-100 border border-gray-200 dark:bg-neutral-500 dark:border-neutral-400 rounded'></div>
                  <span className='text-neutral-600 dark:text-neutral-300'>
                    {t('appointments.pastUnavailable') || 'Past/Unavailable'}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      }
    </Card>
  );
}
