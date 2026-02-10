'use client';

import {
  CalendarIcon,
  DocumentIcon,
  PlusIcon,
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

  // Safety check for translation function
  const safeTranslate = (key) => {
    try {
      return t && typeof t === 'function' ? t(key) : key;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

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
        variant='ghost'
        size='md'
        iconOnly
        onClick={() => setOpen((v) => !v)}
        className='w-10 h-10 border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all'
        aria-expanded={open}
        aria-haspopup='true'
        aria-label={safeTranslate('dashboard.quickActions')}
        title={safeTranslate('dashboard.quickActions')}
      >
        <PlusIcon
          className={`icon icon-sm transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
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
            className='dropdown-menu-unified absolute right-0 top-full mt-1.5'
            data-wide
            role='menu'
          >
            {ACTIONS.map(({ path, labelKey, Icon }) => {
              if (!Icon || typeof Icon !== 'function') {
                console.error(`Invalid Icon component for ${labelKey}`);
                return null;
              }
              return (
                <Button
                  key={path}
                  type='button'
                  variant='ghost'
                  size='sm'
                  role='menuitem'
                  className='!min-h-0 !w-full !justify-start'
                  onClick={() => {
                    if (onNavigate && typeof onNavigate === 'function') {
                      onNavigate(path);
                    } else {
                      window.location.href = path;
                    }
                    setOpen(false);
                  }}
                >
                  <Icon className='icon icon-sm shrink-0' aria-hidden />
                  <span>{safeTranslate(labelKey)}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
