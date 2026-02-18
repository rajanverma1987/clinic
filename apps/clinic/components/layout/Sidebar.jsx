'use client';

import {
  BarChart2Icon,
  Building2Icon,
  CalendarIcon,
  ChatIcon,
  ChevronRightIcon,
  ClockIcon,
  CodeIcon,
  CreditCardIcon,
  InventoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PaletteIcon,
  PanelLeftCloseIcon,
  PrescriptionIcon,
  QueueIcon,
  ReceiptIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  TrendingUpIcon,
  UserAddIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
  XIcon,
  ZapIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { isManagerPathForbidden } from '@/lib/constants/route-security.js';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants.js';
import { logger } from '@/lib/utils/logger.js';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProfileMenu } from './ProfileMenu.jsx';

/* ─── NavItem ───────────────────────────────────────────────────────────── */
function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
  prefetchItem = false,
  onFlyoutShow,
  onFlyoutHide,
}) {
  const handleMouseEnter = (e) => {
    if (isCollapsed && onFlyoutShow) {
      const rect = e.currentTarget.getBoundingClientRect();
      onFlyoutShow(label, rect);
    }
  };
  const handleMouseLeave = () => {
    if (isCollapsed && onFlyoutHide) onFlyoutHide();
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      prefetch={prefetchItem}
      aria-label={label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        'group flex rounded-lg min-h-[44px] text-sm font-medium',
        'transition-colors duration-200 ease-out select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
        isCollapsed
          ? 'justify-center items-center w-10 h-10 mx-auto'
          : 'items-center px-3 py-2.5 gap-3 w-full',
        isActive
          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
      ].join(' ')}
    >
      <Icon
        className={[
          'icon icon-md flex-shrink-0 transition-transform duration-200 ease-out group-hover:scale-105',
          isActive
            ? 'text-white'
            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200',
        ].join(' ')}
      />
      {!isCollapsed && (
        <span className='flex-1 min-w-0 text-left truncate leading-none'>{label}</span>
      )}
    </Link>
  );
}

/* ─── NavSection ────────────────────────────────────────────────────────── */
function NavSection({ label, isCollapsed, first = false, children }) {
  const kids = (Array.isArray(children) ? children : [children]).filter(Boolean);
  if (!kids.length) return null;
  return (
    <div className={['flex flex-col', first ? 'gap-0.5' : 'gap-0.5 mt-4'].join(' ')}>
      {!first && isCollapsed && (
        <div className='my-1.5 mx-2 border-t border-neutral-200 dark:border-neutral-700' />
      )}
      {!isCollapsed && label && (
        <p className='px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 select-none'>
          {label}
        </p>
      )}
      {kids}
    </div>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────────── */
export function Sidebar({ isMobileOpen = false, onMobileClose }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const prefetchOnHover = useCallback((href) => () => router.prefetch(href), [router]);
  const { t } = useI18n();
  const { hasFeature, loading: featuresLoading } = useFeatures();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCollapsedRef = useRef(false);
  const [flyout, setFlyout] = useState({ label: '', top: 0, left: 0 });
  const flyoutTimeoutRef = useRef(null);

  const showFlyout = useCallback((label, rect) => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setFlyout({ label, top: rect.top + rect.height / 2 - 12, left: rect.right + 8 });
  }, []);

  const hideFlyout = useCallback(() => {
    flyoutTimeoutRef.current = setTimeout(() => setFlyout((f) => ({ ...f, label: '' })), 80);
  }, []);

  useEffect(
    () => () => {
      if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    },
    [],
  );

  // Sync collapsed state from localStorage after mount (prevents hydration mismatch)
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
      const shouldCollapse = saved === 'true';
      setIsCollapsed(shouldCollapse);
      isCollapsedRef.current = shouldCollapse;
    } catch (error) {
      logger.warn('Failed to read sidebar state from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  // Keep collapsed state stable across navigation
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
      if (saved === 'true' && !isCollapsed) {
        setIsCollapsed(true);
        isCollapsedRef.current = true;
      } else if (saved !== 'true' && isCollapsed && saved !== null) {
        setIsCollapsed(false);
        isCollapsedRef.current = false;
      }
    } catch (error) {
      logger.warn('Failed to sync sidebar state with localStorage:', error);
    }
  }, [pathname, isCollapsed]);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
    window.dispatchEvent(new CustomEvent('sidebarToggle'));
  };

  const handleLinkClick = useCallback(() => {
    if (typeof onMobileClose === 'function') onMobileClose();
    if (isCollapsed || isCollapsedRef.current) {
      localStorage.setItem('sidebarCollapsed', 'true');
      setIsCollapsed(true);
      isCollapsedRef.current = true;
    }
  }, [isCollapsed, onMobileClose]);

  /* ─── Active state detection for clinic items ─────────────────── */
  const currentTab = searchParams?.get('tab');

  const getIsActive = (item) => {
    const hrefPath = item.href.split('?')[0];
    const tab = item.href.includes('?tab=') ? item.href.split('?tab=')[1]?.split('&')[0] : null;
    if (tab === 'appointments')
      return (
        (pathname === '/dashboard' && currentTab === 'appointments') ||
        pathname === '/appointments' ||
        pathname?.startsWith('/appointments/')
      );
    if (tab === 'prescriptions')
      return (
        (pathname === '/dashboard' && currentTab === 'prescriptions') ||
        pathname === '/prescriptions' ||
        pathname?.startsWith('/prescriptions/')
      );
    if (hrefPath === '/dashboard') return pathname === '/dashboard' && !currentTab;
    return pathname === hrefPath || pathname?.startsWith(hrefPath + '/');
  };

  /* ─── Clinic nav items (flat, with section tag) ───────────────── */
  const allClinicItems = [
    // Core
    {
      href: '/dashboard',
      labelKey: 'dashboard.title',
      icon: LayoutDashboardIcon,
      section: 'core',
      requiredFeature: null,
    },
    // Doctor-specific (injected when role === doctor)
    {
      href: '/doctors/profile',
      labelKey: 'doctors.profile',
      icon: UserIcon,
      section: 'doctor',
      requiredFeature: null,
      requiredRoles: ['doctor'],
    },
    {
      href: '/doctors/schedule',
      labelKey: 'doctors.schedule',
      icon: ClockIcon,
      section: 'doctor',
      requiredFeature: null,
      requiredRoles: ['doctor'],
    },
    {
      href: '/doctors/earnings',
      labelKey: 'doctors.earnings',
      icon: TrendingUpIcon,
      section: 'doctor',
      requiredFeature: null,
      requiredRoles: ['doctor'],
    },
    {
      href: '/doctors/reviews',
      labelKey: 'doctors.reviews',
      icon: StarIcon,
      section: 'doctor',
      requiredFeature: null,
      requiredRoles: ['doctor'],
    },
    // Clinical
    {
      href: '/dashboard?tab=appointments',
      labelKey: 'appointments.title',
      icon: CalendarIcon,
      section: 'clinical',
      requiredFeature: 'Appointment Scheduling',
    },
    {
      href: '/queue',
      labelKey: 'queue.title',
      icon: QueueIcon,
      section: 'clinical',
      requiredFeature: 'Queue Management',
      requiredPermission: { resource: RESOURCES.QUEUE, action: ACTIONS.READ },
    },
    {
      href: '/patients',
      labelKey: 'patients.title',
      icon: UsersIcon,
      section: 'clinical',
      requiredFeature: 'Patient Management',
    },
    {
      href: '/dashboard?tab=prescriptions',
      labelKey: 'prescriptions.title',
      icon: PrescriptionIcon,
      section: 'clinical',
      requiredFeature: 'Prescriptions Management',
      requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.READ },
    },
    {
      href: '/telemedicine',
      labelKey: 'telemedicine.title',
      icon: VideoIcon,
      section: 'clinical',
      requiredFeature: null,
      requiredPermission: { resource: RESOURCES.TELEMEDICINE, action: ACTIONS.READ },
    },
    // Business
    {
      href: '/invoices',
      labelKey: 'invoices.title',
      icon: ReceiptIcon,
      section: 'business',
      requiredFeature: 'Invoice & Billing',
    },
    {
      href: '/inventory',
      labelKey: 'inventory.title',
      icon: InventoryIcon,
      section: 'business',
      requiredFeature: 'Inventory Management',
    },
    {
      href: '/reports',
      labelKey: 'reports.title',
      icon: BarChart2Icon,
      section: 'business',
      requiredFeature: 'Reports & Analytics',
    },
    // Team
    {
      href: '/staff',
      labelKey: 'staff.title',
      icon: UserAddIcon,
      section: 'team',
      requiredFeature: null,
      requiredRoles: ['doctor', 'clinic_admin', 'admin'],
    },
    // System
    {
      href: '/settings',
      labelKey: 'settings.title',
      icon: SettingsIcon,
      section: 'system',
      requiredFeature: null,
      requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    },
  ];

  const canShowItem = (item) => {
    if (item.requiredRoles && !item.requiredRoles.includes(user?.role)) return false;
    if (
      item.requiredPermission &&
      !hasPermission(user?.role, item.requiredPermission.resource, item.requiredPermission.action)
    )
      return false;
    if (
      user?.role === 'manager' &&
      item.href &&
      isManagerPathForbidden(item.href, user.managerAccess)
    )
      return false;
    return item.requiredFeature === null || featuresLoading || hasFeature(item.requiredFeature);
  };

  const visibleClinicItems = user?.role === 'super_admin' ? [] : allClinicItems.filter(canShowItem);

  const itemsBySection = (section) => visibleClinicItems.filter((item) => item.section === section);

  /* ─── Super admin nav sections (data-driven) ──────────────────── */
  const superAdminSections = [
    {
      label: null,
      items: [
        {
          href: '/admin',
          label: t('admin.dashboard'),
          icon: ShieldIcon,
          match: (p) => p === '/admin',
        },
      ],
    },
    {
      labelKey: 'nav.sectionManagement',
      items: [
        {
          href: '/admin/clients',
          label: t('admin.clients'),
          icon: Building2Icon,
          match: (p) => p === '/admin/clients',
        },
        {
          href: '/admin/subscriptions',
          label: t('admin.subscriptions'),
          icon: CreditCardIcon,
          match: (p) => p === '/admin/subscriptions',
        },
        {
          href: '/admin/users',
          label: t('admin.allUsers'),
          icon: UserIcon,
          match: (p) => p === '/admin/users',
        },
        {
          href: '/admin/doctors',
          label: t('admin.doctors'),
          icon: VideoIcon,
          match: (p) => p === '/admin/doctors' || p?.startsWith('/admin/doctors/'),
        },
        {
          href: '/admin/create-admin',
          label: t('admin.createAdmin'),
          icon: UserAddIcon,
          match: (p) => p === '/admin/create-admin',
        },
        {
          href: '/admin/users/create-manager',
          label: t('settings.createManager'),
          icon: UsersIcon,
          match: (p) => p === '/admin/users/create-manager',
        },
      ],
    },
    {
      labelKey: 'nav.sectionContentFinance',
      items: [
        {
          href: '/admin/content',
          label: t('admin.content'),
          icon: PaletteIcon,
          match: (p) => p?.startsWith('/admin/content'),
        },
        {
          href: '/admin/financial',
          label: t('admin.financial'),
          icon: ReceiptIcon,
          match: (p) => p?.startsWith('/admin/financial'),
        },
      ],
    },
    {
      labelKey: 'nav.sectionAnalytics',
      items: [
        {
          href: '/admin/reports',
          label: t('admin.reports'),
          icon: BarChart2Icon,
          match: (p) => p?.startsWith('/admin/reports'),
        },
        {
          href: '/admin/analytics',
          label: t('admin.analytics') || 'Analytics',
          icon: ZapIcon,
          match: (p) => p?.startsWith('/admin/analytics'),
        },
        {
          href: '/admin/activity-logs',
          label: t('admin.activityLogs'),
          icon: RefreshCwIcon,
          match: (p) => p?.startsWith('/admin/activity-logs'),
        },
      ],
    },
    {
      labelKey: 'nav.sectionSystem',
      items: [
        {
          href: '/admin/support',
          label: t('admin.supportTickets') || 'Support',
          icon: ChatIcon,
          match: (p) => p?.startsWith('/admin/support'),
        },
        {
          href: '/api-docs',
          label: t('nav.apiDocs'),
          icon: CodeIcon,
          match: (p) => p === '/api-docs',
        },
        {
          href: '/admin/settings',
          label: t('admin.settings'),
          icon: SettingsIcon,
          match: (p) => p?.startsWith('/admin/settings'),
        },
      ],
    },
  ];

  const showSubscriptionFooter =
    user?.role !== 'super_admin' && hasPermission(user?.role, RESOURCES.SUBSCRIPTION, ACTIONS.READ);

  /* ─── Shared props factory for NavItem ────────────────────────── */
  const navItemProps = (extra = {}) => ({
    isCollapsed,
    onClick: handleLinkClick,
    onFlyoutShow: showFlyout,
    onFlyoutHide: hideFlyout,
    ...extra,
  });

  const clinicNavItem = (item) => {
    const label = t(item.labelKey);
    return (
      <NavItem
        key={item.href}
        href={item.href}
        label={label}
        icon={item.icon}
        isActive={getIsActive(item)}
        prefetchItem
        {...navItemProps({
          onClick: () => {
            prefetchOnHover(item.href)();
            handleLinkClick();
          },
        })}
      />
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && typeof onMobileClose === 'function' && (
        <button
          type='button'
          aria-label={t('common.closeMenu')}
          className='md:hidden fixed inset-0 bg-neutral-900/30 backdrop-blur-[2px] z-[1000]'
          onClick={onMobileClose}
        />
      )}

      <div
        data-collapsed={isCollapsed}
        className={[
          'layout-sidebar flex flex-col sticky top-0',
          'bg-white dark:bg-neutral-900',
          'border-r border-neutral-200 dark:border-neutral-800',
          isCollapsed ? 'overflow-visible' : 'overflow-hidden',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[1001]',
          'max-md:transition-transform max-md:duration-300 max-md:ease-out',
          isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        ].join(' ')}
        style={{
          width: isCollapsed ? '4rem' : 'var(--dashboard-sidebar-width, 256px)',
          minWidth: isCollapsed ? '4rem' : 'var(--dashboard-sidebar-width, 256px)',
          maxWidth: isCollapsed ? '4rem' : 'var(--dashboard-sidebar-width, 256px)',
          height: '100vh',
          flexShrink: 0,
          flexGrow: 0,
          transition:
            'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1), max-width 0.3s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'width',
          zIndex: 'var(--z-sidebar, 1000)',
        }}
      >
        {/* Mobile close button */}
        {typeof onMobileClose === 'function' && (
          <div className='md:hidden absolute top-3 right-3 z-20'>
            <button
              type='button'
              onClick={onMobileClose}
              className='w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
              aria-label={t('common.closeMenu')}
            >
              <XIcon className='icon icon-sm' ariaHidden />
            </button>
          </div>
        )}

        {/* ── Logo ── */}
        <div
          className={[
            'flex-shrink-0 flex items-center justify-center overflow-hidden',
            'border-b border-neutral-200 dark:border-neutral-800',
            isCollapsed ? 'h-[90px] px-2 py-4' : 'h-[101px] px-4 py-7',
          ].join(' ')}
        >
          <Link
            href='/dashboard'
            onClick={handleLinkClick}
            prefetch={true}
            className='flex items-center justify-center min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg w-full'
            aria-label={t('dashboard.title')}
          >
            <img
              src='/images/logoclinic.png'
              alt={t('common.altClinicLogo')}
              className='block object-contain flex-shrink-0'
              style={{
                height: isCollapsed ? 28 : 34,
                width: isCollapsed ? 28 : 'auto',
                maxWidth: isCollapsed ? 28 : 140,
                maxHeight: isCollapsed ? 28 : 40,
                transition: 'height 0.3s ease, width 0.3s ease, max-width 0.3s ease',
              }}
            />
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav
          className={[
            'flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide py-3 flex flex-col',
            isCollapsed ? 'px-2' : 'px-3',
          ].join(' ')}
        >
          {user?.role === 'super_admin' ? (
            /* Super admin – grouped sections */
            superAdminSections.map((section, i) => (
              <NavSection
                key={i}
                label={section.labelKey ? t(section.labelKey) : section.label}
                isCollapsed={isCollapsed}
                first={i === 0}
              >
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={item.match(pathname)}
                    prefetchItem={false}
                    {...navItemProps()}
                  />
                ))}
              </NavSection>
            ))
          ) : (
            /* Clinic users – grouped sections */
            <>
              <NavSection label={null} isCollapsed={isCollapsed} first>
                {itemsBySection('core').map(clinicNavItem)}
              </NavSection>

              {itemsBySection('doctor').length > 0 && (
                <NavSection label={t('nav.sectionMyPractice')} isCollapsed={isCollapsed}>
                  {itemsBySection('doctor').map(clinicNavItem)}
                </NavSection>
              )}

              {itemsBySection('clinical').length > 0 && (
                <NavSection label={t('nav.sectionClinical')} isCollapsed={isCollapsed}>
                  {itemsBySection('clinical').map(clinicNavItem)}
                </NavSection>
              )}

              {itemsBySection('business').length > 0 && (
                <NavSection label={t('nav.sectionBusiness')} isCollapsed={isCollapsed}>
                  {itemsBySection('business').map(clinicNavItem)}
                </NavSection>
              )}

              {itemsBySection('team').length > 0 && (
                <NavSection label={t('nav.sectionTeam')} isCollapsed={isCollapsed}>
                  {itemsBySection('team').map(clinicNavItem)}
                </NavSection>
              )}

              {itemsBySection('system').length > 0 && (
                <NavSection label={t('nav.sectionSystem')} isCollapsed={isCollapsed}>
                  {itemsBySection('system').map(clinicNavItem)}
                </NavSection>
              )}
            </>
          )}
        </nav>

        {/* ── Footer: Profile + Collapse + Logout ── */}
        <div className='flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800 flex flex-col min-h-0'>
          {/* Profile block */}
          <div className={[isCollapsed ? 'px-2 py-2' : 'px-3 py-2'].join(' ')}>
            <ProfileMenu isCollapsed={isCollapsed} showSubscriptionLinks={showSubscriptionFooter} />
          </div>

          {/* Collapse + Logout row */}
          <div
            className={[
              'border-t border-neutral-100 dark:border-neutral-800 pt-2 pb-3 shrink-0',
              isCollapsed ? 'px-2 flex flex-col items-center gap-1.5' : 'px-3 flex flex-row gap-2',
            ].join(' ')}
          >
            {/* Collapse toggle */}
            <button
              type='button'
              onClick={handleToggle}
              aria-label={isCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
              className={[
                'group flex items-center gap-2 rounded-lg transition-all duration-150',
                'border border-neutral-200 dark:border-neutral-700',
                'bg-white dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400',
                'hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600',
                'dark:hover:border-primary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-400',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isCollapsed ? 'justify-center w-9 h-9 px-0' : 'flex-1 min-w-0 px-2.5 py-1.5',
              ].join(' ')}
            >
              {isCollapsed ? (
                <ChevronRightIcon className='icon icon-sm flex-shrink-0' ariaHidden />
              ) : (
                <>
                  <PanelLeftCloseIcon className='icon icon-sm flex-shrink-0' ariaHidden />
                  <span className='text-[11px] font-medium truncate'>
                    {t('common.collapseMenu')}
                  </span>
                </>
              )}
            </button>

            {/* Logout – theme standard (status-error) */}
            <button
              type='button'
              onClick={() => setShowLogoutConfirm(true)}
              aria-label={t('auth.logout')}
              className={[
                'group flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ease-out',
                'bg-status-error text-white border border-status-error shadow-sm',
                'hover:opacity-90 active:opacity-80',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus:ring-offset-neutral-900',
                isCollapsed ? 'w-9 h-9 px-0' : 'px-2.5 py-1.5 min-h-[2.25rem]',
              ].join(' ')}
            >
              <LogOutIcon className='icon icon-sm flex-shrink-0' ariaHidden />
              {!isCollapsed && (
                <span className='text-[11px] font-medium truncate'>{t('auth.logout')}</span>
              )}
            </button>
          </div>
        </div>

        {/* Flyout (collapsed hover) – portal for label */}
        {typeof document !== 'undefined' &&
          flyout.label &&
          createPortal(
            <div
              className='fixed z-[1100] px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-150'
              style={{ top: flyout.top, left: flyout.left }}
            >
              {flyout.label}
            </div>,
            document.body,
          )}

        {/* Logout confirmation modal */}
        <Modal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title={t('auth.confirmLogout')}
          size='sm'
        >
          <div className='space-y-4'>
            <p className='text-neutral-700 dark:text-neutral-300 text-base leading-6'>
              {t('auth.logoutConfirmMessage')}
            </p>
            <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-600'>
              <Button variant='secondary' size='md' onClick={() => setShowLogoutConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant='logout'
                size='md'
                onClick={(e) => {
                  e?.stopPropagation?.();
                  setShowLogoutConfirm(false);
                  logout();
                }}
                type='button'
              >
                {t('auth.signOut')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
