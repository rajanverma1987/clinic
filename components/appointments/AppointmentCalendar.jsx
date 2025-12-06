'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';

/**
 * Compact calendar component showing available appointment slots for a selected date
 * Displays time slots for a single day with availability
 */
export default function AppointmentCalendar({ selectedDoctorId, selectedDate, onSlotSelect, settings }) {
  const { t } = useI18n();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Default working hours (9 AM to 5 PM)
  const defaultStartHour = 9;
  const defaultEndHour = 17;
  // Get slot duration from Queue Settings (Average Consultation Time), default to 30 minutes
  const slotDuration = settings?.queueSettings?.averageConsultationTime || 30; // minutes

  const formatDateForApi = useCallback((date) => {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: settings?.timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return date.toISOString().split('T')[0];
    }
  }, [settings?.timezone]);

  const formatDateDisplay = useCallback((date) => {
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
  }, [settings?.locale, settings?.timezone]);

  const formatTimeDisplay = useCallback((date) => {
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
  }, [settings?.locale, settings?.timezone]);

  // Update currentDate when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Generate time slots for a day
  const generateTimeSlots = (date) => {
    const slots = [];
    const dayStart = new Date(date);
    dayStart.setHours(defaultStartHour, 0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(defaultEndHour, 0, 0, 0, 0);

    let current = new Date(dayStart);
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: false,
        booked: false,
      });
      current = new Date(slotEnd);
    }
    return slots;
  };

  // Fetch appointments for the selected date to determine availability
  const fetchAvailability = useCallback(async () => {
    if (!selectedDoctorId) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    try {
      const dateKey = formatDateForApi(currentDate);
      const startDate = dateKey;
      const endDate = dateKey;

      // Fetch appointments for the selected date
      const response = await apiClient.get(
        `/appointments?doctorId=${selectedDoctorId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const appointmentsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || []);
        // Filter appointments to only include active statuses
        // Include 'in_queue' for video consultations that go directly to queue
        const activeStatuses = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'in_queue'];
        const allAppointments = appointmentsData.filter(apt => 
          activeStatuses.includes(apt.status)
        );
        
        // Filter appointments to only those on the selected date
        const appointments = allAppointments.filter(apt => {
          // Try both appointmentDate and startTime fields
          const aptDate = apt.appointmentDate ? new Date(apt.appointmentDate) : new Date(apt.startTime);
          const aptDateKey = formatDateForApi(aptDate);
          
          // Also check if startTime falls on the selected date
          const aptStartDate = new Date(apt.startTime);
          const aptStartDateKey = formatDateForApi(aptStartDate);
          return aptDateKey === dateKey || aptStartDateKey === dateKey;
        });
                
        // Generate slots for the selected date
        const slots = generateTimeSlots(currentDate);
        
        // Initialize all slots as available first
        slots.forEach((slot) => {
          slot.available = true;
          slot.booked = false;
        });

        // Match doctor's appointments date/time with calendar date/timeslot
        // Mark slot as booked if any appointment date/time matches
        appointments.forEach((apt) => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);

          // Get appointment date string (YYYY-MM-DD format) for comparison
          const aptDateStr = formatDateForApi(aptStart);
          const selectedDateStr = formatDateForApi(currentDate);

          // Check if appointment is on the selected date
          if (aptDateStr !== selectedDateStr) {
            return; // Skip appointments not on this date
          }

          // Get appointment time in minutes from midnight (using clinic timezone)
          // Convert UTC times to clinic timezone for accurate comparison
          const clinicTimezone = settings?.timezone || 'UTC';
          
          // Get hours/minutes in clinic timezone
          const aptStartInClinicTz = new Date(aptStart.toLocaleString('en-US', { timeZone: clinicTimezone }));
          const aptEndInClinicTz = new Date(aptEnd.toLocaleString('en-US', { timeZone: clinicTimezone }));
          
          // Use the original date but extract time in clinic timezone
          const aptStartHours = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: clinicTimezone,
            hour: 'numeric',
            hour12: false
          }).format(aptStart));
          const aptStartMinutes = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: clinicTimezone,
            minute: 'numeric'
          }).format(aptStart));
          const aptEndHours = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: clinicTimezone,
            hour: 'numeric',
            hour12: false
          }).format(aptEnd));
          const aptEndMinutes = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: clinicTimezone,
            minute: 'numeric'
          }).format(aptEnd));
          
          const aptStartTimeMinutes = aptStartHours * 60 + aptStartMinutes;
          const aptEndTimeMinutes = aptEndHours * 60 + aptEndMinutes;

          // Check each slot against this appointment
          slots.forEach((slot, slotIdx) => {
            // Get slot time in minutes from midnight (using clinic timezone)
            const clinicTimezone = settings?.timezone || 'UTC';
            
            // Extract hours/minutes from slot in clinic timezone
            const slotStartHours = parseInt(new Intl.DateTimeFormat('en-US', {
              timeZone: clinicTimezone,
              hour: 'numeric',
              hour12: false
            }).format(slot.start));
            const slotStartMinutes = parseInt(new Intl.DateTimeFormat('en-US', {
              timeZone: clinicTimezone,
              minute: 'numeric'
            }).format(slot.start));
            const slotEndHours = parseInt(new Intl.DateTimeFormat('en-US', {
              timeZone: clinicTimezone,
              hour: 'numeric',
              hour12: false
            }).format(slot.end));
            const slotEndMinutes = parseInt(new Intl.DateTimeFormat('en-US', {
              timeZone: clinicTimezone,
              minute: 'numeric'
            }).format(slot.end));
            
            const slotStartTimeMinutes = slotStartHours * 60 + slotStartMinutes;
            const slotEndTimeMinutes = slotEndHours * 60 + slotEndMinutes;
            
            // Simple overlap check: two time ranges overlap if:
            // slotStart < aptEnd AND aptStart < slotEnd
            // This covers all cases: partial overlap, complete containment, exact match
            const slotOverlaps = slotStartTimeMinutes < aptEndTimeMinutes && aptStartTimeMinutes < slotEndTimeMinutes;
            
            if (slotOverlaps) {
              slot.available = false;
              slot.booked = true;
            }
          });
        });

        // Get current date/time for past slot detection
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDay = new Date(currentDate);
        selectedDay.setHours(0, 0, 0, 0);
        const isToday = selectedDay.getTime() === today.getTime();

        // Format slots with date and time info - preserve booked status
        const formattedSlots = slots.map((slot) => {
          const slotHour = slot.start.getHours();
          const slotMinute = slot.start.getMinutes();
          const slotDate = new Date(currentDate);
          slotDate.setHours(slotHour, slotMinute, 0, 0);
          
          // Check if this slot is in the past (only if selected date is today)
          let isPastSlot = false;
          if (isToday) {
            // Create a date object for this slot's start time in the clinic timezone
            const slotDateTime = new Date(slotDate);
            // Compare with current time
            isPastSlot = slotDateTime < now;
          } else if (selectedDay < today) {
            // If the entire day is in the past, all slots are past
            isPastSlot = true;
          }
          
          // Explicitly preserve booked and available status from the slot object
          const isBooked = slot.booked === true;
          const isAvailable = slot.available === true && !isBooked && !isPastSlot;
          
          return {
            ...slot, // This includes available and booked properties
            start: new Date(slotDate),
            end: new Date(slotDate.getTime() + slotDuration * 60000),
            date: new Date(currentDate),
            dateKey: dateKey,
            hour: slotHour,
            minute: slotMinute,
            // Explicitly preserve booked and available status
            available: isAvailable,
            booked: isBooked,
            isPast: isPastSlot,
          };
        });
        

        setAvailableSlots(formattedSlots);
      } else {
        // Still generate slots even if no appointments
        const slots = generateTimeSlots(currentDate);
        
        // Get current date/time for past slot detection
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDay = new Date(currentDate);
        selectedDay.setHours(0, 0, 0, 0);
        const isToday = selectedDay.getTime() === today.getTime();
        
        const formattedSlots = slots.map((slot) => {
          const slotHour = slot.start.getHours();
          const slotMinute = slot.start.getMinutes();
          const slotDate = new Date(currentDate);
          slotDate.setHours(slotHour, slotMinute, 0, 0);
          
          // Check if this slot is in the past (only if selected date is today)
          let isPastSlot = false;
          if (isToday) {
            // Create a date object for this slot's start time
            const slotDateTime = new Date(slotDate);
            // Compare with current time
            isPastSlot = slotDateTime < now;
          } else if (selectedDay < today) {
            // If the entire day is in the past, all slots are past
            isPastSlot = true;
          }
          
          return {
            ...slot,
            date: new Date(currentDate),
            dateKey: formatDateForApi(currentDate),
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
      console.error('Failed to fetch availability:', error);
      // Generate empty slots on error
      const slots = generateTimeSlots(currentDate);
      
      // Get current date/time for past slot detection
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDay = new Date(currentDate);
      selectedDay.setHours(0, 0, 0, 0);
      const isToday = selectedDay.getTime() === today.getTime();
      
      const formattedSlots = slots.map((slot) => {
        const slotHour = slot.start.getHours();
        const slotMinute = slot.start.getMinutes();
        const slotDate = new Date(currentDate);
        slotDate.setHours(slotHour, slotMinute, 0, 0);
        
        // Check if this slot is in the past (only if selected date is today)
        let isPastSlot = false;
        if (isToday) {
          // Create a date object for this slot's start time
          const slotDateTime = new Date(slotDate);
          // Compare with current time
          isPastSlot = slotDateTime < now;
        } else if (selectedDay < today) {
          // If the entire day is in the past, all slots are past
          isPastSlot = true;
        }
        
        return {
          ...slot,
          date: new Date(currentDate),
          dateKey: formatDateForApi(currentDate),
          hour: slotHour,
          minute: slotMinute,
          available: !isPastSlot,
          booked: false,
          isPast: isPastSlot,
        };
      });
      setAvailableSlots(formattedSlots);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, currentDate, formatDateForApi, settings]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleSlotClick = (slot) => {
    if (slot.available && !slot.booked && !slot.isPast) {
      setSelectedSlot(slot);
      if (onSlotSelect) {
        onSlotSelect({
          date: slot.date,
          startTime: slot.start,
          endTime: slot.end,
        });
      }
    }
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setCurrentDate(newDate);
    setSelectedSlot(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedSlot(null);
  };

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
    setSelectedSlot(null);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
    setSelectedSlot(null);
  };

  // Check if current date is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDay = new Date(currentDate);
  selectedDay.setHours(0, 0, 0, 0);
  const isToday = selectedDay.getTime() === today.getTime();
  const isPast = selectedDay < today;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('appointments.availabilityCalendar') || 'Availability Calendar'}
        </h3>
      </div>

      {!selectedDoctorId ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t('appointments.selectDoctorToViewAvailability') || 'Select a doctor to view availability'}
        </div>
      ) : (
        <>
          {/* Date Selector */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={goToPreviousDay}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              title={t('appointments.previousDay') || 'Previous Day'}
            >
              ←
            </button>
            <input
              type="date"
              value={formatDateForApi(currentDate)}
              onChange={handleDateChange}
              min={formatDateForApi(today)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={goToNextDay}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              title={t('appointments.nextDay') || 'Next Day'}
            >
              →
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {t('appointments.today') || 'Today'}
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600">
              {formatDateDisplay(currentDate)}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-500 text-sm">{t('common.loading')}</div>
            </div>
          ) : (
            <>
              {/* Time Slots Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                {availableSlots.map((slot, idx) => {
                  const slotHour = slot.hour;
                  const slotMinute = slot.minute;
                  const timeStr = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
                  
                  // Explicitly check booked status and past slot status
                  const isBooked = slot?.booked === true;
                  const isPastSlot = slot?.isPast === true;
                  const isAvailable = slot ? (slot.available && !isBooked && !isPastSlot) : false;
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
                    slotClass = 'bg-blue-600 text-white border-blue-600 cursor-pointer';
                    slotTitle = `${timeStr} - ${t('appointments.available') || 'Available'} (${t('appointments.selected') || 'Selected'})`;
                    slotIcon = '✓';
                  } else if (isBooked) {
                    // Booked slots should always be red and disabled
                    slotClass = 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed opacity-75';
                    slotTitle = `${timeStr} - ${t('appointments.booked') || 'Booked'}`;
                    slotIcon = '●';
                  } else if (isPastSlot) {
                    slotClass = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
                    slotTitle = `${timeStr} - ${t('appointments.past') || 'Past'}`;
                    slotIcon = '—';
                  } else if (isAvailable) {
                    slotClass = 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 cursor-pointer';
                    slotTitle = `${timeStr} - ${t('appointments.available') || 'Available'}`;
                    slotIcon = '○';
                  } else {
                    slotClass = 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
                    slotTitle = `${timeStr} - ${t('appointments.unavailable') || 'Unavailable'}`;
                    slotIcon = '—';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isBooked || !isAvailable || isPastSlot}
                      className={`py-2 px-3 text-xs rounded border transition-colors font-medium ${slotClass}`}
                      title={slotTitle}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold">{timeStr}</span>
                        <span className="text-base mt-0.5">{slotIcon}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-50 border border-green-300 rounded"></div>
                  <span className="text-gray-600">{t('appointments.available') || 'Available'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">{t('appointments.booked') || 'Booked'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                  <span className="text-gray-600">{t('appointments.pastUnavailable') || 'Past/Unavailable'}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
