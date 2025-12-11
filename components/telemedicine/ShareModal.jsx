'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

export function ShareModal({ isOpen, onClose, sessionId, sessionData, onSendEmail }) {
  const [copied, setCopied] = useState(false);
  const patientLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/telemedicine/${sessionId}?role=patient`
      : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(patientLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEmailSend = async () => {
    if (!sessionData?.patientId?.email) {
      alert('Patient email address is not available. Please copy the link and share it manually.');
      return;
    }

    try {
      await onSendEmail();
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Unable to send email. Please copy the link and share it manually.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Share Video Call Link'>
      <div className='space-y-4'>
        <p className='text-gray-600 text-sm'>
          Share this link with the patient to join the video consultation:
        </p>

        <div className='flex gap-2'>
          <Input value={patientLink} readOnly className='flex-1' />
          <Button onClick={handleCopyLink} variant='secondary' size='md'>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {sessionData?.patientId?.email && (
          <div className='pt-4 border-t'>
            <p className='text-gray-600 text-sm mb-2'>Or send the link directly via email:</p>
            <Button onClick={handleEmailSend} variant='primary' size='md' className='w-full'>
              Send Email to {sessionData.patientId.email}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
