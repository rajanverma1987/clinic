'use client';

import { useI18n } from '@/contexts/I18nContext';

export function SessionInfo({ sessionDuration, sessionId, sessionData }) {
  const { t } = useI18n();

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const doctorName =
    sessionData?.doctorId?.firstName || sessionData?.doctorId?.name
      ? [sessionData.doctorId.firstName, sessionData.doctorId.lastName].filter(Boolean).join(' ') ||
        sessionData.doctorId.name
      : null;
  const patientName =
    sessionData?.patientId?.firstName || sessionData?.patientId?.name
      ? [sessionData.patientId.firstName, sessionData.patientId.lastName]
          .filter(Boolean)
          .join(' ') || sessionData.patientId.name
      : null;
  const subtitle = [doctorName, patientName].filter(Boolean).join(' • ') || sessionId;

  return (
    <div className='flex items-center gap-2 sm:gap-4 flex-1 min-w-0'>
      <div className='w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0'>
        <svg
          className='w-5 h-5 sm:w-6 sm:h-6 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
          />
        </svg>
      </div>
      <div className='min-w-0 flex-1'>
        <h2 className='text-neutral-900 dark:text-neutral-100 font-semibold text-sm sm:text-base truncate'>
          {t('telemedicine.consultationTitle')}
        </h2>
        <p className='text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm truncate'>
          {t('telemedicine.sessionLabel')}: {subtitle}
        </p>
      </div>
      {sessionDuration > 0 && (
        <div className='text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm flex-shrink-0'>
          <span className='text-neutral-600 dark:text-neutral-400 hidden sm:inline'>
            {t('telemedicine.duration')}:{' '}
          </span>
          <span className='font-mono font-medium'>{formatDuration(sessionDuration)}</span>
        </div>
      )}
    </div>
  );
}
