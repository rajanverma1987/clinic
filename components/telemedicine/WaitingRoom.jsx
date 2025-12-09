'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

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
  currentUserId 
}) {
  const [pendingParticipants, setPendingParticipants] = useState([]);

  useEffect(() => {
    // Filter participants who are waiting (not admitted)
    const pending = participants.filter(p => 
      p.status === 'waiting' && p.userId !== currentUserId
    );
    setPendingParticipants(pending);
  }, [participants, currentUserId]);

  if (!isHost || pendingParticipants.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-white text-xl font-semibold mb-4">Waiting Room</h3>
        <p className="text-gray-400 text-sm mb-4">
          {pendingParticipants.length} participant{pendingParticipants.length > 1 ? 's' : ''} waiting
        </p>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {pendingParticipants.map((participant) => (
            <div 
              key={participant.userId}
              className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {participant.name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {participant.name || 'Participant'}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {participant.role || 'Patient'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onAdmit(participant.userId)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  Admit
                </button>
                <button
                  onClick={() => onReject(participant.userId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
