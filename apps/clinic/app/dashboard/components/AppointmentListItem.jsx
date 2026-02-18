'use client';

import { ClockIcon, PhoneIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import React, { useCallback, useEffect, useState } from 'react';

/**
 * Single appointment row for dashboard lists. Memoized for list performance.
 * For doctor dashboard: pass isCurrent, onViewHistory, onStart, onReschedule, onCancel for full schedule card with actions and timer.
 */
function AppointmentListItemInner({
  appointment,
  onClick,
  isCurrent = false,
  onViewHistory,
  onStart,
  onReschedule,
  onCancel,
}) {
  const { t } = useI18n();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const appointmentTime = new Date(
    appointment.appointmentDate ||
      appointment.schedule?.startTime ||
      appointment.startTime ||
      appointment.date,
  );
  const startTime = appointment.startedAt
    ? new Date(appointment.startedAt)
    : new Date(appointment.schedule?.startTime || appointment.startTime || appointmentTime);
  const endTime = new Date(appointment.schedule?.endTime || appointment.endTime || appointmentTime);
  const timeStr = appointmentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const patientName =
    appointment.patientId?.name ||
    `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim() ||
    t('common.unknownPatient');
  const firstName = appointment.patientId?.firstName || '';
  const lastName = appointment.patientId?.lastName || '';
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'PN';
  const phone = appointment.patientId?.phone || appointment.patientId?.primaryPhone || '';

  const visitType = appointment.type || 'consultation';
  const chiefComplaint = appointment.chiefComplaint || appointment.reason || '—';
  const reason = appointment.reason || appointment.type || t('common.generalConsultation');

  const status = appointment.status || 'scheduled';
  const isOngoing = status === 'in_progress' || status === 'arrived';

  const showActions = [onViewHistory, onStart, onReschedule, onCancel].some(Boolean);

  const computeElapsed = useCallback(() => {
    if (!isOngoing) return 0;
    const start = startTime.getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / 1000));
  }, [isOngoing, startTime]);

  useEffect(() => {
    if (!isOngoing) return;
    setElapsedSeconds(computeElapsed());
    const interval = setInterval(() => setElapsedSeconds(computeElapsed()), 1000);
    return () => clearInterval(interval);
  }, [isOngoing, computeElapsed]);

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (e) => {
    if (e.target.closest('[data-action-button]')) return;
    onClick?.(e);
  };

  const handleAction = (e, fn) => {
    e.stopPropagation();
    fn?.(e);
  };

  return (
    <div
      className={`dashboard-appointment-item group ${isCurrent ? 'dashboard-appointment-item-current' : ''}`}
      onClick={handleCardClick}
    >
      <div className='flex items-start gap-3'>
        <div className='w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0 border-2 border-primary-200 dark:border-primary-700'>
          <span className='text-primary-600 dark:text-primary-300 font-semibold text-sm'>
            {initials}
          </span>
        </div>

        <div className='flex-1 min-w-0'>
          <h4 className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5 truncate'>
            {patientName}
          </h4>
          {showActions && (
            <>
              {phone && (
                <p className='text-body-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1 truncate'>
                  <PhoneIcon className='icon icon-xs flex-shrink-0' />
                  {phone}
                </p>
              )}
              <p className='text-body-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                <span className='font-medium'>{t('dashboard.visitType')}:</span> {visitType}
              </p>
              <p className='text-body-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5'>
                <span className='font-medium'>{t('dashboard.chiefComplaint')}:</span>{' '}
                {chiefComplaint}
              </p>
            </>
          )}
          {!showActions && (
            <p className='text-body-xs text-neutral-600 dark:text-neutral-400 truncate'>{reason}</p>
          )}
        </div>

        <div
          className={`time-badge ${isOngoing ? 'time-badge-ongoing' : ''} flex-shrink-0 !bg-neutral-100 !text-neutral-700 dark:!bg-neutral-800/60 dark:!text-neutral-200`}
        >
          {isOngoing ? (
            <div className='flex flex-col items-center gap-0.5'>
              <span className='text-body-xs font-semibold'>{t('dashboard.onGoing')}</span>
              <span className='text-body-xs opacity-90' title={t('dashboard.elapsed')}>
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-1'>
              <ClockIcon className='icon icon-xs' />
              <span className='text-body-xs font-semibold'>{timeStr}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className='flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-600'>
          {onViewHistory && (
            <button
              type='button'
              data-action-button
              className='text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline'
              onClick={(e) => handleAction(e, () => onViewHistory(appointment))}
            >
              {t('dashboard.viewHistory')}
            </button>
          )}
          {onStart && (
            <button
              type='button'
              data-action-button
              className='text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline'
              onClick={(e) => handleAction(e, () => onStart(appointment))}
            >
              {t('dashboard.startConsultation')}
            </button>
          )}
          {onReschedule && (
            <button
              type='button'
              data-action-button
              className='text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:underline'
              onClick={(e) => handleAction(e, () => onReschedule(appointment))}
            >
              {t('dashboard.reschedule')}
            </button>
          )}
          {onCancel && (
            <button
              type='button'
              data-action-button
              className='text-xs font-medium text-red-600 hover:text-red-700 hover:underline'
              onClick={(e) => handleAction(e, () => onCancel(appointment))}
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const AppointmentListItem = React.memo(AppointmentListItemInner);
