'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { showError } from '@/lib/utils/toast';
import { useState } from 'react';

export function ShareModal({ isOpen, onClose, sessionId, sessionData, onSendEmail }) {
  const { t } = useI18n();
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
      logger.error('Failed to copy:', error);
    }
  };

  const handleEmailSend = async () => {
    if (!sessionData?.patientId?.email) {
      showError(
        t('telemedicine.patientEmailNotAvailable') ||
          'Patient email address is not available. Please copy the link and share it manually.',
      );
      return;
    }

    try {
      await onSendEmail();
      onClose();
    } catch (error) {
      logger.error('Failed to send email:', error);
      showError(
        t('telemedicine.unableToSendEmail') ||
          'Unable to send email. Please copy the link and share it manually.',
      );
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('telemedicine.shareVideoCallLink')}>
      <div className='space-y-4'>
        <p className='text-gray-600 text-sm'>
          {t('telemedicine.shareLinkWithPatient')}
        </p>

        <div className='flex gap-2'>
          <Input value={patientLink} readOnly className='flex-1' />
          <Button onClick={handleCopyLink} variant='secondary' size='md'>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {sessionData?.patientId?.email && (
          <div className='pt-4 border-t'>
            <p className='text-gray-600 text-sm mb-2'>{t('telemedicine.orSendViaEmail')}</p>
            <Button onClick={handleEmailSend} variant='primary' size='md' className='w-full'>
              {t('telemedicine.sendEmailTo', { email: sessionData.patientId.email })}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
