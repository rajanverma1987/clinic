'use client';

import {
  CalendarIcon,
  ChevronDownIcon,
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
    return <div className='h-9 w-32 rounded-lg bg-neutral-100 animate-pulse' aria-hidden />;
  }

  return (
    <div className='relative inline-block' ref={menuRef}>
      <Button
        type='button'
        variant='secondary'
        size='sm'
        onClick={() => setOpen((v) => !v)}
        className='gap-2 focus:ring-0 focus:ring-offset-0'
        aria-expanded={open}
        aria-haspopup='true'
        aria-label={t('dashboard.quickActions')}
      >
        <span>{t('dashboard.quickActions')}</span>
        <ChevronDownIcon
          className={`icon icon-sm shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          ariaHidden
        />
      </Button>

      {open && (
        <>
          <div
            className='fixed inset-0 z-[10040]'
            aria-hidden='true'
            onClick={() => setOpen(false)}
          />
          <div
            className='quick-actions-dropdown absolute right-0 top-full z-[10050] mt-1.5'
            role='menu'
          >
            {ACTIONS.map(({ path, labelKey, Icon }) => (
              <Button
                key={path}
                type='button'
                variant='ghost'
                size='sm'
                role='menuitem'
                className='!min-h-0'
                onClick={() => {
                  onNavigate(path);
                  setOpen(false);
                }}
              >
                <Icon className='icon icon-sm shrink-0' aria-hidden />
                <span>{t(labelKey)}</span>
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
