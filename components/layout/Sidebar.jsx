'use client';

import {
  BarChart2Icon,
  BellIcon,
  Building2Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CodeIcon,
  CreditCardIcon,
  DocumentIcon,
  HistoryIcon,
  InventoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  PaletteIcon,
  PrescriptionIcon,
  QueueIcon,
  ReceiptIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldIcon,
  SmartphoneIcon,
  StarIcon,
  TrendingUpIcon,
  UserAddIcon,
  UserIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants.js';
import { logger } from '@/lib/utils/logger.js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SidebarTooltip } from '@/components/ui/SidebarTooltip';
import { ProfileMenu } from './ProfileMenu.jsx';

export function Sidebar({ isMobileOpen = false, onMobileClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const prefetchOnHover = useCallback((href) => () => router.prefetch(href), [router]);
  const { t } = useI18n();
  const { hasFeature, loading: featuresLoading } = useFeatures();

  // Initialize collapsed state to false (server-side default) to prevent hydration mismatch
  // Will be updated after mount from localStorage
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState({ anchor: null, label: '' });
  const isCollapsedRef = useRef(false);

  // Mark component as mounted and sync with localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
      const shouldCollapse = saved === 'true';
      setIsCollapsed(shouldCollapse);
      isCollapsedRef.current = shouldCollapse;
    } catch (error) {
      logger.warn('Failed to read sidebar state from localStorage:', error);
      setIsCollapsed(false);
      isCollapsedRef.current = false;
    }
  }, []);

  const navIcon = (IconComponent) => (
    <span className='sidebar-nav-icon' aria-hidden>
      <IconComponent className='sidebar-nav-icon' />
    </span>
  );
  const IconDashboard = () => navIcon(LayoutDashboardIcon);
  const IconPatients = () => navIcon(UsersIcon);
  const IconStaff = () => navIcon(UserAddIcon);
  const IconAppointments = () => navIcon(CalendarIcon);
  const IconQueue = () => navIcon(QueueIcon);
  const IconPrescriptions = () => navIcon(PrescriptionIcon);
  const IconInvoices = () => navIcon(ReceiptIcon);
  const IconInventory = () => navIcon(InventoryIcon);
  const IconLots = () => navIcon(DocumentIcon);
  const IconReports = () => navIcon(BarChart2Icon);
  const IconAnalytics = () => navIcon(ZapIcon);
  const IconSettings = () => navIcon(SettingsIcon);
  const IconAPI = () => navIcon(CodeIcon);
  const IconLocation = () => navIcon(MapPinIcon);
  const IconBranding = () => navIcon(PaletteIcon);
  const IconWhiteLabel = () => navIcon(SmartphoneIcon);
  const IconTelemedicine = () => navIcon(VideoIcon);
  const IconLogout = () => navIcon(LogOutIcon);
  const IconAdmin = () => navIcon(ShieldIcon);
  const IconClients = () => navIcon(Building2Icon);
  const IconSubscriptions = () => navIcon(CreditCardIcon);
  const IconSubscription = () => navIcon(BellIcon);
  const IconCreateAdmin = () => navIcon(UserAddIcon);
  const IconAllUsers = () => navIcon(UserIcon);
  const IconPaymentHistory = () => navIcon(HistoryIcon);
  const IconEarnings = () => navIcon(TrendingUpIcon);
  const IconReviews = () => navIcon(StarIcon);
  const IconSchedule = () => navIcon(ClockIcon);
  const IconProfile = () => navIcon(UserIcon);
  const IconDoctors = () => navIcon(VideoIcon);
  const IconActivityLogs = () => navIcon(RefreshCwIcon);

  // Production clinic sidebar order: Dashboard first → daily workflow (Appointments, Queue, Patients) → clinical/business → settings
  const menuItemsWithFeatures = [
    { href: '/dashboard', labelKey: 'dashboard.title', icon: IconDashboard, requiredFeature: null },
    {
      href: '/appointments',
      labelKey: 'appointments.title',
      icon: IconAppointments,
      requiredFeature: 'Appointment Scheduling',
    },
    {
      href: '/queue',
      labelKey: 'queue.title',
      icon: IconQueue,
      requiredFeature: 'Queue Management',
    },
    {
      href: '/patients',
      labelKey: 'patients.title',
      icon: IconPatients,
      requiredFeature: 'Patient Management',
    },
    {
      href: '/staff',
      labelKey: 'staff.title',
      icon: IconStaff,
      requiredFeature: null,
      requiredRoles: ['doctor', 'clinic_admin'],
    },
    {
      href: '/prescriptions',
      labelKey: 'prescriptions.title',
      icon: IconPrescriptions,
      requiredFeature: 'Prescriptions Management',
      requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.READ },
    },
    {
      href: '/invoices',
      labelKey: 'invoices.title',
      icon: IconInvoices,
      requiredFeature: 'Invoice & Billing',
    },
    {
      href: '/inventory',
      labelKey: 'inventory.title',
      icon: IconInventory,
      requiredFeature: 'Inventory Management',
    },
    {
      href: '/inventory/lots',
      labelKey: 'nav.lots',
      icon: IconLots,
      requiredFeature: 'Inventory Management',
    },
    {
      href: '/reports',
      labelKey: 'reports.title',
      icon: IconReports,
      requiredFeature: 'Reports & Analytics',
    },
    {
      href: '/telemedicine',
      labelKey: 'telemedicine.title',
      icon: IconTelemedicine,
      requiredFeature: null,
    },
    {
      href: '/settings/locations',
      labelKey: 'nav.locations',
      icon: IconLocation,
      requiredFeature: 'Multi-Location Support',
      requiredRoles: ['clinic_admin'],
    },
    {
      href: '/api-docs',
      labelKey: 'nav.apiDocs',
      icon: IconAPI,
      requiredFeature: 'API Access',
      requiredRoles: ['clinic_admin'],
    },
    {
      href: '/settings/branding',
      labelKey: 'nav.branding',
      icon: IconBranding,
      requiredFeature: 'Custom Branding',
      requiredRoles: ['clinic_admin'],
    },
    {
      href: '/settings/white-label',
      labelKey: 'nav.whiteLabel',
      icon: IconWhiteLabel,
      requiredFeature: 'White Label Solution',
      requiredRoles: ['clinic_admin'],
    },
    {
      href: '/settings',
      labelKey: 'settings.title',
      icon: IconSettings,
      requiredFeature: null,
      requiredPermission: { resource: RESOURCES.SETTINGS, action: ACTIONS.READ },
    },
  ];

  // Doctor-specific items (shown after Dashboard for doctors)
  const doctorMenuItems =
    user?.role === 'doctor'
      ? [
          {
            href: '/doctors/profile',
            labelKey: 'doctors.profile',
            icon: IconProfile,
            requiredFeature: null,
          },
          {
            href: '/doctors/schedule',
            labelKey: 'doctors.schedule',
            icon: IconSchedule,
            requiredFeature: null,
          },
          {
            href: '/doctors/appointments',
            labelKey: 'doctors.appointmentsCalendar',
            icon: IconAppointments,
            requiredFeature: null,
          },
          {
            href: '/doctors/earnings',
            labelKey: 'doctors.earnings',
            icon: IconEarnings,
            requiredFeature: null,
          },
          {
            href: '/doctors/reviews',
            labelKey: 'doctors.reviews',
            icon: IconReviews,
            requiredFeature: null,
          },
        ]
      : [];

  // Doctor can give Admin/Manager only what the subscription allows: nav items with requiredFeature
  // are shown only if hasFeature(requiredFeature) (same plan as Doctor).
  const doctorAlwaysFeatures = [
    'Patient Management',
    'Appointment Scheduling',
    'Prescriptions Management',
    'Queue Management',
  ];
  const canShowItem = (item) => {
    if (item.requiredRoles && !item.requiredRoles.includes(user?.role)) return false;
    if (
      item.requiredPermission &&
      !hasPermission(user?.role, item.requiredPermission.resource, item.requiredPermission.action)
    )
      return false;
    // Subscription gate: Admin and Manager see feature-gated items only if plan includes them (same as Doctor)
    const subscriptionAllows =
      item.requiredFeature === null ||
      hasFeature(item.requiredFeature) ||
      (user?.role === 'doctor' && doctorAlwaysFeatures.includes(item.requiredFeature));
    return subscriptionAllows;
  };

  // While features are still loading, show full menu so sidebar doesn't pop from 3 to N items after 8–10s
  const showAllItems = featuresLoading;

  const stripFeature = (item) => {
    const { requiredFeature: _f, requiredRoles: _r, ...rest } = item;
    return rest;
  };
  const dashboardItem = menuItemsWithFeatures.find((m) => m.href === '/dashboard');
  const restClinicItems = menuItemsWithFeatures.filter((m) => m.href !== '/dashboard');

  const menuItems =
    user?.role === 'super_admin'
      ? []
      : [
          ...(dashboardItem && (showAllItems || canShowItem(dashboardItem))
            ? [stripFeature(dashboardItem)]
            : []),
          ...(user?.role === 'doctor' ? doctorMenuItems.map(stripFeature) : []),
          ...restClinicItems.filter((item) => showAllItems || canShowItem(item)).map(stripFeature),
        ];

  // Update ref when state changes
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  // Ensure collapsed state persists during navigation - prevent any expansion
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
      if (saved === 'true' && !isCollapsed) {
        // Force collapsed state immediately if it should be collapsed
        setIsCollapsed(true);
        isCollapsedRef.current = true;
      } else if (saved !== 'true' && isCollapsed && saved !== null) {
        // Only allow expansion if explicitly not collapsed in storage
        setIsCollapsed(false);
        isCollapsedRef.current = false;
      }
    } catch (error) {
      logger.warn('Failed to sync sidebar state with localStorage:', error);
    }
  }, [pathname, isCollapsed]);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    // Dispatch custom event to notify Layout of sidebar width change
    window.dispatchEvent(new CustomEvent('sidebarToggle'));
  };

  // Lock collapsed state before navigation
  const handleLinkClick = useCallback(() => {
    if (typeof onMobileClose === 'function') onMobileClose();
    if (isCollapsed || isCollapsedRef.current) {
      localStorage.setItem('sidebarCollapsed', 'true');
      setIsCollapsed(true);
      isCollapsedRef.current = true;
    }
  }, [isCollapsed, onMobileClose]);

  return (
    <>
      {/* Mobile backdrop: visible only on small screens when sidebar open */}
      {isMobileOpen && typeof onMobileClose === 'function' && (
        <button
          type='button'
          aria-label='Close menu'
          className='md:hidden fixed inset-0 bg-neutral-600/25 z-[var(--z-sidebar)] transition-opacity'
          style={{ zIndex: 1000 }}
          onClick={onMobileClose}
        />
      )}
      <div
        className={`text-neutral-900 dark:text-neutral-100 flex flex-col sticky top-0 border-r border-neutral-200 dark:border-neutral-700 relative ${isCollapsed ? 'overflow-visible' : 'overflow-hidden'} bg-gradient-to-br from-white via-neutral-50 to-primary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[1001] max-md:transition-transform max-md:duration-300 max-md:ease-out ${isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
        data-collapsed={isCollapsed}
        style={{
          width: isCollapsed ? '5rem' : 'var(--dashboard-sidebar-width, 280px)',
          minWidth: isCollapsed ? '5rem' : 'var(--dashboard-sidebar-width, 280px)',
          maxWidth: isCollapsed ? '5rem' : 'var(--dashboard-sidebar-width, 280px)',
          height: '100vh',
          minHeight: 0,
          flexShrink: 0,
          flexGrow: 0,
          transition:
            'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 'var(--z-sidebar, 1000)',
          willChange: 'width, min-width, max-width',
          transform: 'translateZ(0)',
          WebkitTransition:
            'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Mobile: close button (touch target 44px) */}
        {typeof onMobileClose === 'function' && (
          <div className='md:hidden absolute top-2 right-2 z-20'>
            <button
              type='button'
              onClick={onMobileClose}
              className='min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 p-2'
              aria-label='Close menu'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </button>
          </div>
        )}
        {/* Logo – top of sidebar, links to dashboard (always visible in app shell) */}
        <div
          className='sidebar-logo flex-shrink-0 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-center bg-white dark:bg-neutral-800'
          style={{
            padding: isCollapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-4) var(--space-4) var(--space-3)',
            transition: 'padding 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Link
            href='/dashboard'
            onClick={handleLinkClick}
            prefetch={true}
            className='flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg'
            aria-label={t('dashboard.title')}
          >
            <img
              src='/images/logoclinic.png'
              alt='Clinic Logo'
              className='object-contain'
              style={{
                height: isCollapsed ? 32 : 40,
                width: isCollapsed ? 32 : 'auto',
                maxWidth: isCollapsed ? 32 : 140,
              }}
            />
          </Link>
        </div>
        {/* Profile Section – below logo */}
        <div
          className='sidebar-profile-header border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0 relative z-10 bg-white dark:bg-neutral-800'
          style={{
            padding: isCollapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-4)',
            transition: 'padding 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ProfileMenu isCollapsed={isCollapsed} />
        </div>

        {/* Navigation Section – sticky sidebar: this area scrolls when menu items overflow (scrollbar hidden) */}
        <nav
          className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 scrollbar-hide'
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--dashboard-sidebar-gap, 8px)',
            padding: isCollapsed ? 'var(--space-3)' : 'var(--space-4) var(--space-6)',
            paddingBottom: isCollapsed ? 'var(--space-3)' : 'var(--space-4)',
          }}
        >
          {user?.role === 'super_admin' ? (
            /* Admin Section - Only for super_admin */
            <>
              {!isCollapsed && (
                <div className='pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700'>
                  <p className='text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 px-3 uppercase tracking-wider'>
                    Admin
                  </p>
                </div>
              )}
              <Link
                href='/admin'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.dashboard') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.dashboard') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconAdmin />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.dashboard')}
                </span>
              </Link>
              <Link
                href='/admin/clients'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.clients') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/clients'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.clients') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconClients />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.clients')}
                </span>
              </Link>
              <Link
                href='/admin/subscriptions'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.subscriptions') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/subscriptions'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.subscriptions') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconSubscriptions />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.subscriptions')}
                </span>
              </Link>
              <Link
                href='/admin/users'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.allUsers') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/users'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.allUsers') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconAllUsers />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.allUsers')}
                </span>
              </Link>
              <Link
                href='/admin/patients'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.patients') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/patients' || pathname?.startsWith('/admin/patients/')
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.patients') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconPatients />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.patients')}
                </span>
              </Link>
              <Link
                href='/admin/appointments'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.appointments') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/appointments'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.appointments') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconAppointments />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.appointments')}
                </span>
              </Link>
              <Link
                href='/admin/doctors'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.doctors') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/doctors' || pathname?.startsWith('/admin/doctors/')
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.doctors') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconDoctors />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.doctors')}
                </span>
              </Link>
              <Link
                href='/admin/create-admin'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.createAdmin') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                } min-h-[44px] text-body-sm font-medium ${
                  pathname === '/admin/create-admin'
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.createAdmin') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconCreateAdmin />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.createAdmin')}
                </span>
              </Link>
              <Link
                href='/admin/content'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.content') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/content') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.content') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconBranding />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.content')}
                </span>
              </Link>
              <Link
                href='/admin/financial'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.financial') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/financial') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.financial') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconInvoices />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.financial')}
                </span>
              </Link>
              <Link
                href='/admin/reports'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.reports') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/reports') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.reports') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconReports />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.reports')}
                </span>
              </Link>
              <Link
                href='/admin/analytics'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.analytics') || 'Analytics' })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/analytics') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? (t('admin.analytics') || 'Analytics') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconAnalytics />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.analytics') || 'Analytics'}
                </span>
              </Link>
              <Link
                href='/admin/activity-logs'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.activityLogs') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/activity-logs') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.activityLogs') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconActivityLogs />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.activityLogs')}
                </span>
              </Link>
              <Link
                href='/admin/settings'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.settings') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/settings') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.settings') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconSettings />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.settings')}
                </span>
              </Link>
              <Link
                href='/admin/reviews'
                onClick={handleLinkClick}
                prefetch={false}
                onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('admin.reviews') })}
                onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'} min-h-[44px] text-body-sm font-medium ${pathname?.startsWith('/admin/reviews') ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500' : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'}`}
                title={isCollapsed ? undefined : ''}
                aria-label={isCollapsed ? t('admin.reviews') : undefined}
              >
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                >
                  <IconReviews />
                </span>
                <span
                  className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                >
                  {t('admin.reviews')}
                </span>
              </Link>
            </>
          ) : (
            /* Regular menu items for non-admin users */
            <>
              {menuItems.map((item) => {
                const itemMatches = pathname === item.href || pathname?.startsWith(item.href + '/');
                const longerMatchExists = menuItems.some(
                  (other) =>
                    other.href.length > item.href.length &&
                    (pathname === other.href || pathname?.startsWith(other.href + '/'))
                );
                const isActive = itemMatches && !longerMatchExists;
                const displayLabel = item.labelKey ? t(item.labelKey) : item.label;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={(e) => {
                      prefetchOnHover(item.href)();
                      if (isCollapsed) setTooltip({ anchor: e.currentTarget, label: displayLabel });
                    }}
                    onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                    onClick={handleLinkClick}
                    prefetch={true}
                    className={`flex items-center ${
                      isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                    } min-h-[44px] text-body-sm font-medium ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                    title={isCollapsed ? undefined : ''}
                    aria-label={isCollapsed ? displayLabel : undefined}
                  >
                    <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                      {item.icon && <item.icon />}
                    </span>
                    <span
                      className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                    >
                      {displayLabel}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer Section – Subscription + Payment History + Collapse toggle (fixed at bottom) */}
        <div
          className='sidebar-collapse-footer border-t border-neutral-200 dark:border-neutral-700 flex-shrink-0 relative z-10'
          style={{
            padding: isCollapsed ? 'var(--space-2) var(--space-2)' : 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap-2)',
            background: 'transparent',
          }}
        >
          {/* Subscription + Payment History – same block as Collapse (only for non–super_admin with permission) */}
          {user?.role !== 'super_admin' &&
            hasPermission(user?.role, RESOURCES.SUBSCRIPTION, ACTIONS.READ) && (
              <div className='sidebar-subscription-section flex flex-col gap-0'>
                {!isCollapsed && (
                  <div className='pt-2'>
                    <p className='text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 px-3 uppercase tracking-wider'>
                      Subscription
                    </p>
                  </div>
                )}
                <Link
                  href='/subscription'
                  onClick={handleLinkClick}
                  prefetch={false}
                  onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('subscription.title') })}
                  onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                  } min-h-[44px] text-body-sm font-medium ${
                    pathname === '/subscription' || pathname?.startsWith('/subscription/')
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                  title={isCollapsed ? undefined : ''}
                  aria-label={isCollapsed ? t('subscription.title') : undefined}
                >
                  <span
                    className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                  >
                    <IconSubscription />
                  </span>
                  <span
                    className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                  >
                    {t('subscription.title')}
                  </span>
                </Link>
                <Link
                  href='/payment-history'
                  onClick={handleLinkClick}
                  prefetch={false}
                  onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('subscription.paymentHistory') })}
                  onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-3 py-3 mx-1 rounded-xl' : 'px-6 py-4 rounded-lg'
                  } min-h-[44px] text-body-sm font-medium ${
                    pathname === '/payment-history'
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-500'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                  title={isCollapsed ? undefined : ''}
                  aria-label={isCollapsed ? t('subscription.paymentHistory') : undefined}
                >
                  <span
                    className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}
                  >
                    <IconPaymentHistory />
                  </span>
                  <span
                    className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                  >
                    {t('subscription.paymentHistory')}
                  </span>
                </Link>
              </div>
            )}
          <button
            type='button'
            onClick={handleToggle}
            onMouseEnter={(e) => isCollapsed && setTooltip({ anchor: e.currentTarget, label: t('common.expandSidebar') })}
            onMouseLeave={() => isCollapsed && setTooltip({ anchor: null, label: '' })}
            className={`sidebar-collapse-toggle group w-full flex items-center transition-all duration-300 ease-out ${
              isCollapsed
                ? 'justify-center px-0 py-2.5 rounded-full'
                : 'justify-between px-3 py-2.5 rounded-xl'
            }`}
            aria-label={isCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
          >
            {!isCollapsed && (
              <span className='text-body-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                {t('common.collapseMenu')}
              </span>
            )}
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 ${
                isCollapsed ? 'rounded-full' : ''
              } group-hover:bg-primary-50 dark:group-hover:bg-neutral-600 group-hover:border-primary-200 dark:group-hover:border-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200`}
            >
              {isCollapsed ? (
                <ChevronRightIcon className='icon icon-md' ariaHidden />
              ) : (
                <ChevronLeftIcon className='icon icon-md' ariaHidden />
              )}
            </span>
          </button>
        </div>

        {mounted && isCollapsed && (
          <SidebarTooltip
            anchor={tooltip.anchor}
            label={tooltip.label}
            visible={!!tooltip.label}
          />
        )}
      </div>
    </>
  );
}
