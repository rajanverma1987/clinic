'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { XIcon } from '@/components/icons';

const COMMON_REASONS = [
  'Patient requested cancellation',
  'Doctor unavailable',
  'Emergency rescheduling',
  'Patient no-show',
  'Scheduling conflict',
  'Other',
];

/**
 * CancelAppointmentModal
 * Prompts the user for a cancellation reason before cancelling an appointment.
 *
 * Props:
 *   isOpen {boolean}
 *   onClose {fn}
 *   onConfirm {fn(reason: string)}
 *   patientName {string}
 *   loading {boolean}
 */
export function CancelAppointmentModal({ isOpen, onClose, onConfirm, patientName, loading }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setCustom('');
      requestAnimationFrame(() => containerRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || loading) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, loading, onClose]);

  const finalReason = reason === 'Other' ? custom.trim() : reason;
  const canConfirm = finalReason.length > 0;

  const handleConfirm = () => {
    if (!canConfirm || loading) return;
    onConfirm?.(finalReason);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className='ConfirmationModal-backdrop'
      style={{ zIndex: 'var(--z-modal, 10050)' }}
      onClick={() => !loading && onClose?.()}
    >
      <div
        ref={containerRef}
        className='ConfirmationModal-container ConfirmationModal--danger'
        style={{ zIndex: 'var(--z-modal-content, 10051)', maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='cancel-appt-title'
        tabIndex={-1}
      >
        {/* Header */}
        <div className='ConfirmationModal-header'>
          <div className='ConfirmationModal-icon ConfirmationModal-icon--danger'>
            <XIcon className='icon icon-md' aria-hidden />
          </div>
          <h2 id='cancel-appt-title' className='ConfirmationModal-title'>
            Cancel Appointment{patientName ? ` — ${patientName}` : ''}
          </h2>
          <Button variant='ghost' size='xs' iconOnly className='ConfirmationModal-close' onClick={onClose} disabled={loading} aria-label='Close'>
            <XIcon className='icon icon-sm' />
          </Button>
        </div>

        {/* Body */}
        <div className='ConfirmationModal-content'>
          <p className='ConfirmationModal-message mb-4'>Please select or enter a reason for cancellation.</p>

          {/* Quick-pick reason buttons */}
          <div className='flex flex-wrap gap-2 mb-3'>
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type='button'
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  reason === r
                    ? 'bg-status-error text-white border-status-error'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600 hover:border-status-error hover:text-status-error'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Custom reason input (shown when "Other" selected or as fallback) */}
          {(reason === 'Other' || !COMMON_REASONS.includes(reason)) && (
            <textarea
              className='w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-status-error resize-none'
              rows={3}
              maxLength={500}
              placeholder='Describe the reason…'
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          )}
        </div>

        {/* Footer */}
        <div className='ConfirmationModal-footer'>
          <Button variant='secondary' size='md' onClick={onClose} disabled={loading}>
            Keep Appointment
          </Button>
          <Button variant='danger' size='md' onClick={handleConfirm} isLoading={loading} disabled={!canConfirm || loading}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
