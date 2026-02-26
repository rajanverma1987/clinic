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
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ALL_ACTIONS = [
  {
    path: '/appointments/new',
    labelKey: 'dashboard.newAppointment',
    Icon: CalendarIcon,
    requiredPermission: { resource: RESOURCES.APPOINTMENT, action: ACTIONS.CREATE },
  },
  {
    path: '/patients?new=true',
    labelKey: 'dashboard.addPatient',
    Icon: UserAddIcon,
    requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.CREATE },
  },
  {
    path: '/queue',
    labelKey: 'dashboard.emergencyCheckin',
    Icon: QueueIcon,
    requiredPermission: { resource: RESOURCES.QUEUE, action: ACTIONS.CREATE },
  },
  {
    path: '/prescriptions/new',
    labelKey: 'dashboard.newPrescription',
    Icon: PrescriptionIcon,
    requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.CREATE },
  },
  {
    path: '/reports',
    labelKey: 'dashboard.generateReport',
    Icon: DocumentIcon,
    requiredPermission: { resource: RESOURCES.REPORT, action: ACTIONS.READ },
  },
];

/**
 * Quick Actions – single header-style button that opens a dropdown with role-filtered options.
 * Place in header bar via PageHeader actionButton.
 */
export function QuickActions({ onNavigate, loading = false, userRole }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // When dropdown opens, position it below the trigger so it appears above the navbar (portal)
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  // Safety check for translation function
  const safeTranslate = (key) => {
    try {
      return t && typeof t === 'function' ? t(key) : key;
    } catch (error) {
      logger.error('Translation error:', error);
      return key;
    }
  };

  // Filter actions based on role permissions
  const visibleActions = ALL_ACTIONS.filter(({ requiredPermission }) => {
    if (!userRole || !requiredPermission) return true;
    return hasPermission(userRole, requiredPermission.resource, requiredPermission.action);
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideTrigger = menuRef.current?.contains(e.target);
      const insideDropdown = dropdownRef.current?.contains(e.target);
      if (!insideTrigger && !insideDropdown) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (loading) {
    return (
      <div
        className='h-9 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-700 animate-pulse'
        aria-hidden
      />
    );
  }

  if (visibleActions.length === 0) return null;

  return (
    <div className='relative inline-block' ref={menuRef}>
      <Button
        type='button'
        variant='primary'
        size='sm'
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup='true'
        aria-label={safeTranslate('dashboard.quickActions')}
        title={safeTranslate('dashboard.quickActions')}
      >
        <PlusIcon
          className={`icon icon-sm flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          ariaHidden
        />
        <span>{safeTranslate('dashboard.quickActions')}</span>
      </Button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className='dropdown-menu-unified fixed z-[10050]'
            data-wide
            role='menu'
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
              left: 'auto',
            }}
          >
            {visibleActions.map(({ path, labelKey, Icon }) => {
              if (!Icon || typeof Icon !== 'function') {
                logger.error(`Invalid Icon component for ${labelKey}`);
                return null;
              }
              return (
                <Button
                  key={path}
                  type='button'
                  variant='ghost'
                  size='sm'
                  role='menuitem'
                  size='auto'
                  fullWidth
                  align='start'
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
          </div>,
          document.body,
        )}
    </div>
  );
}
