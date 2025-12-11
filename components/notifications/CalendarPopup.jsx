'use client';

/**
 * Calendar Popup Component
 * Shows today's appointments in a calendar-style popup
 */

import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function CalendarPopup({ isOpen, onClose, buttonRef }) {
  const { t } = useI18n();
  const { settings } = useSettings();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // Fetch today's appointments
  useEffect(() => {
    if (!isOpen) return;

    const fetchTodayAppointments = async () => {
      setLoading(true);
      try {
        const timezone = settings?.settings?.timezone || 'UTC';
        const today = new Date();
        const todayStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(today);

        const response = await apiClient.get(`/appointments?date=${todayStr}&limit=50`);
        if (response.success && response.data) {
          const appointmentsList = response.data.data || [];
          // Filter out video consultations and arrived status
          const filteredAppointments = appointmentsList.filter(
            (apt) => !apt.isTelemedicine && apt.status !== 'arrived'
          );
          setAppointments(filteredAppointments);
        }
      } catch (error) {
        console.error('Failed to fetch today appointments:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, [isOpen, settings]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  // Position popup relative to button
  useEffect(() => {
    if (!isOpen || !buttonRef?.current || !popupRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popup = popupRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position below the button, aligned to the right
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const spaceRight = viewportWidth - buttonRect.right;
    const spaceLeft = buttonRect.left;

    if (spaceBelow >= 400 || spaceBelow > spaceAbove) {
      // Position below
      popup.style.top = `${buttonRect.bottom + 12}px`;
      popup.style.bottom = 'auto';
    } else {
      // Position above
      popup.style.bottom = `${viewportHeight - buttonRect.top + 12}px`;
      popup.style.top = 'auto';
    }

    // Align to right edge of button
    if (spaceRight >= 380) {
      popup.style.right = `${viewportWidth - buttonRect.right}px`;
      popup.style.left = 'auto';
    } else if (spaceLeft >= 380) {
      popup.style.left = `${buttonRect.left}px`;
      popup.style.right = 'auto';
    } else {
      // Center if neither side has enough space
      popup.style.left = '50%';
      popup.style.right = 'auto';
      popup.style.transform = 'translateX(-50%)';
    }
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat(settings?.settings?.locale || 'en-US', {
        timeZone: settings?.settings?.timezone || 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return new Date(date).toLocaleDateString();
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'completed':
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
      case 'cancelled':
        return 'bg-status-error/10 text-status-error border-status-error/30';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const today = new Date();
  const todayFormatted = formatDate(today);

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/5 backdrop-blur-sm z-[var(--z-dropdown-backdrop-high,10051)]'
        onClick={onClose}
      />

      {/* Calendar Popup */}
      <div
        ref={popupRef}
        className='fixed bg-white rounded-2xl shadow-2xl border-2 border-neutral-200 overflow-hidden z-[var(--z-dropdown-menu-high,10050)]'
        style={{
          width: '380px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className='bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4'
          style={{
            background: 'linear-gradient(135deg, #2D9CDB 0%, #0F89C7 100%)',
          }}
        >
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <h3 className='font-bold text-lg'>Today's Appointments</h3>
            </div>
            <button
              onClick={onClose}
              className='text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
          <p className='text-white/90 text-sm'>{todayFormatted}</p>
        </div>

        {/* Appointments List */}
        <div className='flex-1 overflow-y-auto' style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-neutral-400'>Loading appointments...</div>
            </div>
          ) : appointments.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 px-4'>
              <svg
                className='w-16 h-16 text-neutral-300 mb-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <p className='text-neutral-500 font-medium mb-1'>No appointments today</p>
              <p className='text-neutral-400 text-sm text-center'>You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className='p-3 space-y-2'>
              {appointments.map((appointment) => (
                <div
                  key={appointment._id || appointment.id}
                  onClick={() => {
                    router.push(`/appointments/${appointment._id || appointment.id}`);
                    onClose();
                  }}
                  className='p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all bg-white hover:border-primary-300 group'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <div className='w-2 h-2 rounded-full bg-primary-500 group-hover:bg-primary-600 transition-colors'></div>
                        <span className='font-semibold text-neutral-900 text-sm'>
                          {formatTime(appointment.startTime)}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </span>
                      </div>
                      <p className='font-medium text-neutral-900 mb-1'>
                        {appointment.patientId?.firstName ||
                          appointment.patient?.firstName ||
                          'Unknown'}{' '}
                        {appointment.patientId?.lastName || appointment.patient?.lastName || ''}
                      </p>
                      {(appointment.doctorId || appointment.doctor) && (
                        <p className='text-sm text-neutral-600 mb-2'>
                          Dr.{' '}
                          {appointment.doctorId?.firstName || appointment.doctor?.firstName || ''}{' '}
                          {appointment.doctorId?.lastName || appointment.doctor?.lastName || ''}
                        </p>
                      )}
                      {appointment.type && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.type}
                        </span>
                      )}
                    </div>
                    <div className='flex-shrink-0'>
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {appointments.length > 0 && (
          <div className='border-t border-neutral-200 p-3 bg-neutral-50'>
            <button
              onClick={() => {
                router.push('/appointments');
                onClose();
              }}
              className='w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors text-sm'
            >
              View All Appointments
            </button>
          </div>
        )}
      </div>
    </>
  );
}
