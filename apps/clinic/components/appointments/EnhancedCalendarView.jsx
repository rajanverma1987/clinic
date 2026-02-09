'use client';

/**
 * Enhanced Calendar View Component
 *
 * Full-featured calendar with day/week/month views and drag-drop rescheduling
 *
 * Features:
 * - Day/Week/Month view toggle
 * - Drag and drop appointments to reschedule
 * - Color-coded status indicators
 * - Doctor/Department filters
 * - Quick actions on appointments
 *
 * @module components/appointments/EnhancedCalendarView
 * @since 1.0.0
 */

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tabs } from '@/components/ui/Tabs';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger.js';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useCallback, useState } from 'react';

const VIEW_MODES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  no_show: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function EnhancedCalendarView({
  appointments = [],
  loading = false,
  onAppointmentUpdate,
  onAppointmentClick,
  selectedDoctorId,
  selectedDepartmentId,
  viewMode: initialViewMode = VIEW_MODES.WEEK,
}) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Get start and end of current view period
  const getViewRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === VIEW_MODES.DAY) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === VIEW_MODES.WEEK) {
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // MONTH
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Filter appointments for current view
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointmentDate || apt.startTime);
    const { start, end } = getViewRange();
    return aptDate >= start && aptDate <= end;
  });

  // Handle drag start
  const handleDragStart = (e, appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment._id);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop - reschedule appointment
  const handleDrop = async (e, targetDate, targetTime) => {
    e.preventDefault();

    if (!draggedAppointment) return;

    try {
      setUpdating(true);

      const newStartTime = new Date(targetDate);
      const [hours, minutes] = targetTime.split(':').map(Number);
      newStartTime.setHours(hours, minutes, 0, 0);

      const duration = draggedAppointment.duration || 30;
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + duration);

      const response = await apiClient.put(`/appointments/${draggedAppointment._id}`, {
        appointmentDate: targetDate.toISOString().split('T')[0],
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
      });

      if (response.success) {
        showSuccess(t('appointments.rescheduledSuccess'));
        if (onAppointmentUpdate) {
          onAppointmentUpdate(response.data);
        }
      } else {
        showError(t('appointments.failedToReschedule'));
      }
    } catch (err) {
      logger.error('Failed to reschedule appointment', err);
      showError(t('appointments.failedToReschedule'));
    } finally {
      setUpdating(false);
      setDraggedAppointment(null);
    }
  };

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === VIEW_MODES.DAY) {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === VIEW_MODES.WEEK) {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === VIEW_MODES.DAY) {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === VIEW_MODES.WEEK) {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayAppointments = filteredAppointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate || apt.startTime);
      return aptDate.toDateString() === currentDate.toDateString();
    });

    return (
      <div className='space-y-2'>
        {hours.map((hour) => {
          const hourAppointments = dayAppointments.filter((apt) => {
            const aptTime = new Date(apt.startTime);
            return aptTime.getHours() === hour;
          });

          return (
            <div key={hour} className='flex border-b border-neutral-200 min-h-[60px]'>
              <div className='w-20 text-sm text-neutral-600 p-2'>{hour}:00</div>
              <div className='flex-1 p-2 space-y-1'>
                {hourAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, apt)}
                    onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                    className={`p-2 rounded border cursor-move hover:shadow-md transition-shadow ${
                      STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                    }`}
                  >
                    <div className='font-semibold text-sm'>
                      {apt.patientId?.firstName} {apt.patientId?.lastName}
                    </div>
                    <div className='text-xs'>
                      {new Date(apt.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const { start } = getViewRange();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className='overflow-x-auto'>
        <div className='flex min-w-[800px]'>
          {/* Time column */}
          <div className='w-20 flex-shrink-0'>
            <div className='h-12 border-b border-r border-neutral-200'></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className='h-16 border-b border-r border-neutral-200 text-xs text-neutral-600 p-1'
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayAppointments = filteredAppointments.filter((apt) => {
              const aptDate = new Date(apt.appointmentDate || apt.startTime);
              return aptDate.toDateString() === day.toDateString();
            });

            return (
              <div
                key={day.toISOString()}
                className='flex-1 border-r border-neutral-200'
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const hour = Math.floor(y / 64);
                  const targetTime = `${hour.toString().padStart(2, '0')}:00`;
                  handleDrop(e, day, targetTime);
                }}
              >
                {/* Day header */}
                <div className='h-12 border-b border-neutral-200 p-2 text-center'>
                  <div className='text-sm font-semibold'>
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className='text-xs text-neutral-600'>{day.getDate()}</div>
                </div>

                {/* Hour slots */}
                {hours.map((hour) => {
                  const hourAppointments = dayAppointments.filter((apt) => {
                    const aptTime = new Date(apt.startTime);
                    return aptTime.getHours() === hour;
                  });

                  return (
                    <div key={hour} className='h-16 border-b border-neutral-200 p-1 relative'>
                      {hourAppointments.map((apt) => (
                        <div
                          key={apt._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt)}
                          onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                          className={`absolute inset-x-1 p-1 rounded border cursor-move hover:shadow-md transition-shadow text-xs ${
                            STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                          }`}
                          style={{
                            top: `${(new Date(apt.startTime).getMinutes() / 60) * 100}%`,
                            height: `${((apt.duration || 30) / 60) * 100}%`,
                          }}
                        >
                          <div className='font-semibold truncate'>
                            {apt.patientId?.firstName} {apt.patientId?.lastName}
                          </div>
                          <div className='text-xs truncate'>
                            {new Date(apt.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const { start } = getViewRange();
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i));
    }

    return (
      <div className='grid grid-cols-7 gap-1'>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className='p-2 text-center font-semibold text-sm text-neutral-700'>
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className='min-h-[100px] border border-neutral-200 rounded'
              ></div>
            );
          }

          const dayAppointments = filteredAppointments.filter((apt) => {
            const aptDate = new Date(apt.appointmentDate || apt.startTime);
            return aptDate.toDateString() === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] border rounded p-1 ${
                isToday ? 'bg-primary-50 border-primary-300' : 'border-neutral-200'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                handleDrop(e, day, '09:00');
              }}
            >
              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary-700' : ''}`}>
                {day.getDate()}
              </div>
              <div className='space-y-1'>
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, apt)}
                    onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                    className={`text-xs p-1 rounded border cursor-move hover:shadow-sm truncate ${
                      STATUS_COLORS[apt.status] || STATUS_COLORS.scheduled
                    }`}
                  >
                    {new Date(apt.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {apt.patientId?.firstName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className='text-xs text-neutral-500'>+{dayAppointments.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className='p-6'>
      {/* Controls – tab design for view mode, icons for date navigation */}
      <div className='flex items-center justify-between flex-wrap gap-4 mb-6'>
        <div className='w-fit flex-shrink-0'>
          <Tabs
            tabs={[
              { id: VIEW_MODES.DAY, label: 'Day' },
              { id: VIEW_MODES.WEEK, label: 'Week' },
              { id: VIEW_MODES.MONTH, label: 'Month' },
            ]}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id)}
            idPrefix='enhanced-calendar-view'
            ariaLabel='Calendar view'
          />
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={goToPrevious}
            aria-label='Previous'
            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
          >
            <ChevronLeftIcon className='icon icon-md' />
          </button>
          <button
            type='button'
            onClick={goToToday}
            aria-label='Go to today'
            className='inline-flex items-center justify-center min-w-[4rem] h-10 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-body-sm font-medium hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
          >
            Today
          </button>
          <button
            type='button'
            onClick={goToNext}
            aria-label='Next'
            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
          >
            <ChevronRightIcon className='icon icon-md' />
          </button>
          <span className='text-lg font-semibold text-neutral-900 ml-2'>
            {viewMode === VIEW_MODES.DAY &&
              currentDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            {viewMode === VIEW_MODES.WEEK && (
              <>
                {getViewRange().start.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {getViewRange().end.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </>
            )}
            {viewMode === VIEW_MODES.MONTH &&
              currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader type='section' text={t('common.loading')} />
        </div>
      ) : (
        <div className='overflow-auto'>
          {viewMode === VIEW_MODES.DAY && renderDayView()}
          {viewMode === VIEW_MODES.WEEK && renderWeekView()}
          {viewMode === VIEW_MODES.MONTH && renderMonthView()}
        </div>
      )}

      {/* Legend */}
      <div className='mt-6 flex flex-wrap gap-4 text-sm'>
        <div className='font-semibold'>Status:</div>
        {Object.entries(STATUS_COLORS).map(([status, className]) => (
          <div key={status} className='flex items-center gap-2'>
            <div className={`w-4 h-4 rounded border ${className}`}></div>
            <span className='capitalize'>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
