'use client';

import { Button } from '@/components/ui/Button';

export function RecordingConsentModal({ isOpen, onConsent, onDecline }) {
  if (!isOpen) return null;

  return (
    <div
      className='absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center'
      style={{ zIndex: 'var(--z-modal, 50)' }}
    >
      <div className='bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700'>
        <h3 className='text-white text-xl font-semibold mb-4'>Recording Consent</h3>
        <p className='text-gray-300 mb-4'>
          This session may be recorded for medical records and quality assurance purposes. By
          continuing, you consent to the recording of this consultation.
        </p>
        <div className='flex space-x-3'>
          <Button
            onClick={() => onConsent(true)}
            className='flex-1 bg-green-600 hover:bg-green-700'
          >
            I Consent
          </Button>
          <Button onClick={() => onConsent(false)} className='flex-1 bg-red-600 hover:bg-red-700'>
            Decline
          </Button>
        </div>
        <p className='text-gray-500 text-xs mt-4'>
          Note: Recording will be disabled if you decline consent.
        </p>
      </div>
    </div>
  );
}
