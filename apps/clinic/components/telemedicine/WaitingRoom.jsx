'use client';

import { Button } from '@/components/ui/Button';
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
  const [pendingParticipants, setPendingParticipants] = useState([]);

  useEffect(() => {
    // Filter participants who are waiting (not admitted)
    const pending = participants.filter(
      (p) => p.status === 'waiting' && p.userId !== currentUserId
    );
    setPendingParticipants(pending);
  }, [participants, currentUserId]);

  if (!isHost || pendingParticipants.length === 0) {
    return null;
  }

  return (
    <div
      className='absolute inset-0 bg-neutral-500/40 backdrop-blur-sm flex items-center justify-center'
      style={{ zIndex: 'var(--z-modal, 50)' }}
    >
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-neutral-300 shadow-xl'>
        <h3 className='text-neutral-900 text-xl font-semibold mb-4'>Waiting Room</h3>
        <p className='text-gray-400 text-sm mb-4'>
          {pendingParticipants.length} participant{pendingParticipants.length > 1 ? 's' : ''}{' '}
          waiting
        </p>

        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {pendingParticipants.map((participant) => (
            <div
              key={participant.userId}
              className='bg-white border border-neutral-300 rounded-lg p-4 flex items-center justify-between shadow-sm'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center'>
                  <span className='text-neutral-900 font-semibold'>
                    {participant.name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
                <div>
                  <p className='text-neutral-800 font-medium'>
                    {participant.name || 'Participant'}
                  </p>
                  <p className='text-gray-400 text-xs'>{participant.role || 'Patient'}</p>
                </div>
              </div>

              <div className='flex space-x-2'>
                <Button variant='secondary' size='sm' onClick={() => onAdmit(participant.userId)}>
                  Admit
                </Button>
                <Button variant='danger' size='sm' onClick={() => onReject(participant.userId)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
