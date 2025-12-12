'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { hasFeature } = useFeatures();

  // Helper function to get translation with fallback
  const getTranslation = (key, fallback) => {
    const translation = t(key);
    return translation !== key ? translation : fallback;
  };

  // Initialize collapsed state to false (server-side default) to prevent hydration mismatch
  // Will be updated after mount from localStorage
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
      console.warn('Failed to read sidebar state from localStorage:', error);
      setIsCollapsed(false);
      isCollapsedRef.current = false;
    }
  }, []);

  // Modern SVG icon components
  const IconDashboard = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
      />
    </svg>
  );

  const IconPatients = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
      />
    </svg>
  );

  const IconAppointments = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      />
    </svg>
  );

  const IconQueue = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
      />
    </svg>
  );

  const IconPrescriptions = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
      />
    </svg>
  );

  const IconInvoices = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  );

  const IconInventory = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
      />
    </svg>
  );

  const IconReports = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      />
    </svg>
  );

  const IconSettings = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  );

  const IconAPI = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
      />
    </svg>
  );

  const IconLocation = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  );

  const IconBranding = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
      />
    </svg>
  );

  const IconTelemedicine = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
      />
    </svg>
  );

  const IconLogout = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
      />
    </svg>
  );

  const IconAdmin = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      />
    </svg>
  );

  const IconClients = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
      />
    </svg>
  );

  const IconSubscriptions = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
      />
    </svg>
  );

  const IconSubscription = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      />
    </svg>
  );

  const IconPaymentHistory = () => (
    <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
      />
    </svg>
  );

  // Feature mapping for menu items
  const menuItemsWithFeatures = [
    { href: '/dashboard', labelKey: 'dashboard.title', icon: IconDashboard, requiredFeature: null }, // Dashboard always available
    {
      href: '/patients',
      labelKey: 'patients.title',
      icon: IconPatients,
      requiredFeature: 'Patient Management',
    },
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
      href: '/prescriptions',
      labelKey: 'prescriptions.title',
      icon: IconPrescriptions,
      requiredFeature: 'Prescriptions Management',
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
      label: 'Lots',
      icon: IconInventory,
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
      label: 'Telemedicine',
      icon: IconTelemedicine,
      requiredFeature: 'Telemedicine',
    },
    {
      href: '/settings/locations',
      label: 'Locations',
      icon: IconLocation,
      requiredFeature: 'Multi-Location Support',
    },
    { href: '/api-docs', label: 'API Docs', icon: IconAPI, requiredFeature: 'API Access' },
    {
      href: '/settings/branding',
      label: 'Branding',
      icon: IconBranding,
      requiredFeature: 'Custom Branding',
    },
    {
      href: '/settings/white-label',
      label: 'White Label',
      icon: IconBranding,
      requiredFeature: 'White Label Solution',
    },
    { href: '/settings', labelKey: 'settings.title', icon: IconSettings, requiredFeature: null }, // Settings always available
  ];

  // Filter menu items based on available features (for non-admin users)
  const menuItems =
    user?.role === 'super_admin'
      ? [] // Admin users see only admin menu
      : menuItemsWithFeatures
          .filter((item) => item.requiredFeature === null || hasFeature(item.requiredFeature))
          .map(({ requiredFeature, ...item }) => item);

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
      console.warn('Failed to sync sidebar state with localStorage:', error);
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
    if (isCollapsed || isCollapsedRef.current) {
      // Immediately lock the state before any navigation happens
      localStorage.setItem('sidebarCollapsed', 'true');
      setIsCollapsed(true);
      isCollapsedRef.current = true;
    }
  }, [isCollapsed]);

  return (
    <div
      className='text-neutral-900 flex flex-col sticky top-0 border-r border-neutral-200 relative overflow-hidden bg-gradient-to-br from-white via-neutral-50 to-primary-50'
      data-collapsed={isCollapsed}
      style={{
        width: isCollapsed ? '3.5rem' : '14rem',
        minWidth: isCollapsed ? '3.5rem' : '14rem',
        maxWidth: isCollapsed ? '3.5rem' : '14rem',
        height: '100vh',
        flexShrink: 0,
        flexGrow: 0,
        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        zIndex: 'var(--z-sidebar, 1000)',
        willChange: 'width, min-width, max-width',
        transform: 'translateZ(0)', // Enable hardware acceleration
        WebkitTransition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header Section - Fixed at top */}
      <div
        className='border-b border-neutral-200 flex-shrink-0 relative z-10'
        style={{
          padding: isCollapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-4)',
          background: 'transparent',
          transition: 'padding 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {!isCollapsed ? (
          <>
            <div
              className='flex items-center justify-center'
              style={{
                minHeight: '80px',
                paddingTop: '16px',
                paddingBottom: '16px',
              }}
            >
              <div
                className='relative flex items-center justify-center'
                style={{
                  width: '120px',
                  height: '80px',
                  maxWidth: '100%',
                }}
              >
                <Image
                  src='/images/logoclinic.png'
                  alt='Clinic Logo'
                  width={120}
                  height={80}
                  className='object-contain'
                  priority
                  quality={90}
                  sizes='120px'
                  style={{
                    width: '120px',
                    height: 'auto',
                    maxHeight: '80px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>
            {/* User Profile Card */}
            {user && (
              <div
                className='bg-white rounded-xl border border-neutral-200 p-3 shadow-sm hover:shadow-md'
                style={{ marginTop: 'var(--space-3)' }}
              >
                <div className='flex items-center gap-3'>
                  {/* Avatar */}
                  <div className='relative flex-shrink-0'>
                    <div
                      className='bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-semibold'
                      style={{
                        width: 'var(--size-2xl)',
                        height: 'var(--size-2xl)',
                        fontSize: 'var(--text-body-md)',
                      }}
                    >
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                      {user?.lastName?.[0]?.toUpperCase() || ''}
                    </div>
                    {/* Status Dot */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full shadow-md ${
                        user?.isActive ? 'bg-secondary-500' : 'bg-status-error'
                      }`}
                      style={{
                        width: 'var(--space-3)',
                        height: 'var(--space-3)',
                      }}
                      title={user?.isActive ? 'Active' : 'Inactive'}
                    ></div>
                  </div>
                  {/* User Info */}
                  <div className='flex-1 min-w-0'>
                    <p
                      className='text-neutral-900 font-semibold truncate'
                      style={{
                        fontSize: 'var(--text-body-sm)',
                        lineHeight: 'var(--text-body-sm-line-height)',
                      }}
                    >
                      {user.role === 'doctor'
                        ? `Dr. ${user.firstName} ${user.lastName}`
                        : `${user.firstName} ${user.lastName}`}
                    </p>
                    <p
                      className='text-neutral-600 truncate'
                      style={{
                        fontSize: 'var(--text-body-xs)',
                        lineHeight: 'var(--text-body-xs-line-height)',
                      }}
                    >
                      {user.role === 'super_admin'
                        ? 'Super Admin'
                        : user.role === 'clinic_admin'
                        ? 'Clinic Admin'
                        : user.role === 'doctor'
                        ? 'Doctor'
                        : user.role === 'staff'
                        ? 'Staff'
                        : user.role || 'User'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className='flex items-center justify-center'
            style={{
              minHeight: '80px',
              paddingTop: '16px',
              paddingBottom: '16px',
            }}
          >
            <div className='relative flex items-center justify-center'>
              <div
                className='relative'
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src='/favicon.ico'
                  alt='Clinic Logo'
                  width={40}
                  height={40}
                  className='object-contain'
                  priority
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                  }}
                />
              </div>
              {/* Status Dot for Collapsed */}
              {user && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full shadow-md ${
                    user?.isActive ? 'bg-secondary-500' : 'bg-status-error'
                  }`}
                  style={{
                    width: 'var(--space-2)',
                    height: 'var(--space-2)',
                  }}
                  title={user?.isActive ? 'Active' : 'Inactive'}
                ></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section - Scrollable */}
      <nav
        className='flex-1 p-3 overflow-y-auto overflow-x-hidden relative z-10'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-2)',
          minHeight: 0,
          flexShrink: 1,
        }}
      >
        {user?.role === 'super_admin' ? (
          /* Admin Section - Only for super_admin */
          <>
            {!isCollapsed && (
              <div className='pt-4 mt-2 border-t border-neutral-200'>
                <p className='text-body-sm font-semibold text-neutral-700 mb-3 px-3 uppercase tracking-wider'>
                  Admin
                </p>
              </div>
            )}
            <Link
              href='/admin'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/admin'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? t('admin.dashboard') : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconAdmin />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t('admin.dashboard')}</span>
            </Link>
            <Link
              href='/admin/clients'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/admin/clients'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? t('admin.clients') : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconClients />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t('admin.clients')}</span>
            </Link>
            <Link
              href='/admin/subscriptions'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/admin/subscriptions'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? t('admin.subscriptions') : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconSubscriptions />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t('admin.subscriptions')}</span>
            </Link>
            <Link
              href='/admin/users'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/admin/users'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? 'All Users' : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconPatients />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>All Users</span>
            </Link>
            <Link
              href='/admin/create-admin'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/admin/create-admin'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? 'Create Admin' : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconAdmin />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Create Admin</span>
            </Link>
          </>
        ) : (
          /* Regular menu items for non-admin users */
          <>
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const displayLabel = item.labelKey ? t(item.labelKey) : item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  prefetch={false}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'px-3'
                  } py-2.5 rounded-lg text-body-sm font-medium ${
                    isActive
                      ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                      : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                  title={isCollapsed ? displayLabel : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                    {item.icon && <item.icon />}
                  </span>
                  <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{displayLabel}</span>
                </Link>
              );
            })}

            {/* Subscription Section */}
            {!isCollapsed && (
              <div className='pt-4 mt-2 border-t border-neutral-200'>
                <p className='text-body-sm font-semibold text-neutral-700 mb-3 px-3 uppercase tracking-wider'>
                  Subscription
                </p>
              </div>
            )}
            <Link
              href='/subscription'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/subscription' || pathname?.startsWith('/subscription/')
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? t('subscription.title') : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconSubscription />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{t('subscription.title')}</span>
            </Link>
            <Link
              href='/payment-history'
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'px-3'
              } py-2.5 rounded-lg text-body-sm font-medium ${
                pathname === '/payment-history'
                  ? 'bg-green-100 text-green-600 shadow-sm border-l-2 border-green-500'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
              title={isCollapsed ? t('subscription.paymentHistory') : ''}
            >
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
                <IconPaymentHistory />
              </span>
              <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                {t('subscription.paymentHistory')}
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer Section - Fixed at bottom */}
      <div
        className='border-t border-neutral-200 flex-shrink-0 relative z-10'
        style={{
          padding: isCollapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-2)',
          background: 'transparent',
        }}
      >
        {/* Premium Toggle Button */}
        <button
          onClick={handleToggle}
          className={`group relative w-full flex items-center transition-all duration-400 ease-in-out ${
            isCollapsed ? 'justify-center px-2.5' : 'px-3'
          } py-2.5 rounded-lg text-body-sm font-semibold bg-gradient-to-r from-white to-neutral-50 border border-neutral-200 hover:border-primary-300 hover:from-primary-50 hover:to-primary-100/50 text-neutral-700 hover:text-primary-700 shadow-sm hover:shadow-md`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shine effect on hover */}
          <span
            className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-shine-once'
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
            }}
          />

          {/* Icon Container */}
          <span
            className={`flex items-center justify-center transition-transform duration-300 ${
              isCollapsed ? '' : 'mr-3'
            } ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'}`}
          >
            {isCollapsed ? (
              <svg
                width='20px'
                height='20px'
                className='transition-transform duration-300 group-hover:scale-110'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            ) : (
              <svg
                width='20px'
                height='20px'
                className='transition-transform duration-300 group-hover:scale-110'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            )}
          </span>

          {/* Text with fade animation */}
          {!isCollapsed && (
            <span className='relative z-10 transition-opacity duration-300 font-medium'>
              Collapse
            </span>
          )}

          {/* Active indicator dot when collapsed */}
          {isCollapsed && (
            <span
              className='absolute top-1 right-1 w-1.5 h-1.5 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'
              style={{
                boxShadow: '0 0 4px rgba(45, 156, 219, 0.6)',
              }}
            />
          )}
        </button>

        {/* Logout Button */}
        <Button
          onClick={() => setShowLogoutConfirm(true)}
          variant='logout'
          size='md'
          className={`w-full ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? t('auth.logout') : ''}
        >
          <span className={`flex items-center ${isCollapsed ? '' : 'w-full'}`}>
            <span className={`transition-all duration-300 ease-in-out ${isCollapsed ? '' : 'mr-3'}`}>
              <IconLogout />
            </span>
            {!isCollapsed && <span className='transition-all duration-300 ease-in-out opacity-100'>{t('auth.logout')}</span>}
          </span>
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={getTranslation('auth.confirmLogout', 'Confirm Sign Out')}
        size='sm'
      >
        <div className='space-y-4'>
          <p className='text-neutral-700' style={{ fontSize: '16px', lineHeight: '24px' }}>
            {getTranslation(
              'auth.logoutConfirmMessage',
              'Are you sure you want to sign out? You will need to sign in again to access your account.'
            )}
          </p>
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200'>
            <Button variant='secondary' size='md' onClick={() => setShowLogoutConfirm(false)}>
              {getTranslation('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant='logout'
              size='md'
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
            >
              {getTranslation('auth.signOut', 'Sign Out')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
