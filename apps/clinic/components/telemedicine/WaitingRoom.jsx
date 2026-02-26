'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useState } from 'react';

/**
 * Waiting Room Component
 * Host (doctor) can admit participants (patients)
 * HIPAA-compliant: Only shows participant info, no PHI
 */
export function WaitingRoom({
  participants = [],
  onAdmit,
  onReject,
  isHost = false,
  currentUserId,
}) {
  const { t } = useI18n();
  const [pendingParticipants, setPendingParticipants] = useState([]);

  useEffect(() => {
    const pending = participants.filter(
      (p) => p.status === 'waiting' && p.userId !== currentUserId,
    );
    setPendingParticipants(pending);
  }, [participants, currentUserId]);

  if (!isHost || pendingParticipants.length === 0) {
    return null;
  }

  return (
    <div
      className='absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-[var(--z-modal,50)] p-4'
      role='dialog'
      aria-modal='true'
      aria-label={t('telemedicine.waitingRoom')}
    >
      <div className='bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-700 shadow-xl'>
        <h3 className='text-neutral-900 dark:text-neutral-100 text-xl font-semibold mb-2'>
          {t('telemedicine.waitingRoom')}
        </h3>
        <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-4'>
          {t('telemedicine.participantsWaiting').replace(
            '{{count}}',
            String(pendingParticipants.length),
          )}
        </p>

        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {pendingParticipants.map((participant) => (
            <div
              key={participant.userId}
              className='bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-lg p-4 flex items-center justify-between gap-3'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <div className='w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold'>
                  {participant.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div className='min-w-0'>
                  <p className='text-neutral-900 dark:text-neutral-100 font-medium truncate'>
                    {participant.name || t('telemedicine.patient')}
                  </p>
                  <p className='text-neutral-500 dark:text-neutral-400 text-xs'>
                    {participant.role || t('telemedicine.patient')}
                  </p>
                </div>
              </div>

              <div className='flex gap-2 flex-shrink-0'>
                <Button variant='secondary' size='sm' onClick={() => onAdmit(participant.userId)}>
                  {t('telemedicine.admit')}
                </Button>
                <Button variant='danger' size='sm' onClick={() => onReject(participant.userId)}>
                  {t('telemedicine.reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
