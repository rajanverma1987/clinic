'use client';

import { Building2Icon, XIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import './Modal.css';

export function Modal({ isOpen, onClose, title, children, size = 'lg', contentClassName = '' }) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
    print: 'max-w-[794px]', // A4 width at 96 DPI (~210mm)
  };

  const modalContent = (
    <div
      className='fixed inset-0 overflow-y-auto'
      onClick={onClose}
      style={{ zIndex: 'var(--z-modal, 10050)' }}
    >
      <div
        className='Modal-backdrop'
        onClick={onClose}
        role='button'
        tabIndex={0}
        aria-label={t('common.closeModal')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <div
        className='fixed inset-0 flex items-center justify-center p-4'
        style={{ zIndex: 'var(--z-modal-content, 10051)', pointerEvents: 'none' }}
      >
        <div
          className={`Modal-container ${sizeClasses[size]} w-full`}
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          {title && (
            <div className='Modal-header'>
              <h2 className='Modal-title'>
                <div className='Modal-title-icon'>
                  <Building2Icon className='icon icon-md' aria-hidden />
                </div>
                {title}
              </h2>
              <Button
                variant='ghost'
                size='xs'
                iconOnly
                className='Modal-close'
                onClick={onClose}
                aria-label={t('common.closeModal')}
              >
                <XIcon className='icon icon-sm' />
              </Button>
            </div>
          )}
          <div
            className={`${title ? 'Modal-content' : 'Modal-content-no-header'} ${contentClassName}`.trim()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
