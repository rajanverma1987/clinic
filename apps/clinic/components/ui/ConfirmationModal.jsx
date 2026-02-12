'use client';

/**
 * Confirmation modal for confirm/cancel actions.
 * Replaces window.confirm with an accessible, i18n-ready modal.
 * Variants: danger (red), warning (amber), info (neutral).
 */
import { InfoIcon, WarningIcon, XIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import './ConfirmationModal.css';

const VARIANTS = {
  danger: 'ConfirmationModal--danger',
  warning: 'ConfirmationModal--warning',
  info: 'ConfirmationModal--info',
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  confirmLoading = false,
  closeOnBackdrop = true,
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || confirmLoading) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, confirmLoading, onClose]);

  const handleConfirm = () => {
    if (confirmLoading) return;
    onConfirm?.();
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop && !confirmLoading) onClose?.();
  };

  const handleContainerKeyDown = (e) => {
    if (e.key !== 'Tab' || !containerRef.current) return;
    const focusable = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const list = Array.from(focusable);
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const displayTitle = title ?? t('common.areYouSure');
  const displayMessage = message ?? t('common.confirmationDescription');
  const displayConfirm = confirmLabel ?? t('common.confirm');
  const displayCancel = cancelLabel ?? t('common.cancel');
  const variantClass = VARIANTS[variant] || VARIANTS.danger;

  if (!isOpen || !mounted) return null;

  const Icon = variant === 'info' ? InfoIcon : WarningIcon;

  const modalContent = (
    <div
      className='ConfirmationModal-backdrop'
      onClick={handleBackdropClick}
      style={{ zIndex: 'var(--z-modal, 10050)' }}
    >
      <div
        ref={containerRef}
        className={`ConfirmationModal-container ${variantClass}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleContainerKeyDown}
        style={{ zIndex: 'var(--z-modal-content, 10051)' }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirmation-modal-title'
        aria-describedby='confirmation-modal-description'
        tabIndex={-1}
      >
        <div className='ConfirmationModal-header'>
          <div className={`ConfirmationModal-icon ConfirmationModal-icon--${variant}`}>
            <Icon className='icon icon-md' aria-hidden />
          </div>
          <h2 id='confirmation-modal-title' className='ConfirmationModal-title'>
            {displayTitle}
          </h2>
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            className='ConfirmationModal-close'
            onClick={onClose}
            disabled={confirmLoading}
            aria-label={t('common.closeModal')}
          >
            <XIcon className='icon icon-sm' />
          </Button>
        </div>
        <div id='confirmation-modal-description' className='ConfirmationModal-content'>
          {typeof displayMessage === 'string' ? (
            <p className='ConfirmationModal-message'>{displayMessage}</p>
          ) : (
            displayMessage
          )}
        </div>
        <div className='ConfirmationModal-footer'>
          <Button variant='secondary' size='md' onClick={onClose} disabled={confirmLoading}>
            {displayCancel}
          </Button>
          <Button
            variant={
              variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'
            }
            size='md'
            onClick={handleConfirm}
            isLoading={confirmLoading}
            disabled={confirmLoading}
          >
            {displayConfirm}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
