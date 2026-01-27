'use client';

import {
  CalendarIcon,
  DocumentIcon,
  PrescriptionIcon,
  QueueIcon,
  UserAddIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useEffect, useRef, useState } from 'react';

const ACTIONS = [
  { path: '/appointments/new', labelKey: 'dashboard.newAppointment', Icon: CalendarIcon },
  { path: '/patients?new=true', labelKey: 'dashboard.addPatient', Icon: UserAddIcon },
  { path: '/queue', labelKey: 'dashboard.emergencyCheckin', Icon: QueueIcon },
  { path: '/prescriptions/new', labelKey: 'dashboard.newPrescription', Icon: PrescriptionIcon },
  { path: '/reports', labelKey: 'dashboard.generateReport', Icon: DocumentIcon },
];

/**
 * Quick Actions – single header-style button that opens a dropdown with all options.
 * Place in header bar via PageHeader actionButton.
 */
export function QuickActions({ onNavigate, loading = false }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (loading) {
    return (
      <div
        className='h-9 w-32 rounded-lg bg-neutral-100 animate-pulse'
        aria-hidden
      />
    );
  }

  return (
    <div className='relative inline-block' ref={menuRef}>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setOpen((v) => !v)}
        className='min-h-[36px] gap-2'
        aria-expanded={open}
        aria-haspopup='true'
        aria-label={t('dashboard.quickActions')}
      >
        <span>{t('dashboard.quickActions')}</span>
        <svg
          className={`icon icon-xs shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </Button>

      {open && (
        <>
          <div
            className='fixed inset-0 z-[10040]'
            aria-hidden='true'
            onClick={() => setOpen(false)}
          />
          <div
            className='absolute right-0 top-full z-[10050] mt-1.5 min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg'
            role='menu'
          >
            {ACTIONS.map(({ path, labelKey, Icon }) => (
              <Button
                key={path}
                type='button'
                variant='ghost'
                size='sm'
                role='menuitem'
                className='w-full justify-start gap-3 rounded-lg py-2.5 font-medium text-neutral-800 hover:bg-primary-50 hover:text-primary-700'
                onClick={() => {
                  onNavigate(path);
                  setOpen(false);
                }}
              >
                <Icon className='icon icon-sm shrink-0 text-primary-600' aria-hidden />
                <span>{t(labelKey)}</span>
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
