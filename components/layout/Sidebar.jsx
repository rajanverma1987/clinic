'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher.jsx';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { hasFeature } = useFeatures();
  
  // Initialize collapsed state synchronously from localStorage to prevent flash
  const getInitialCollapsedState = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  };
  
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  const isCollapsedRef = useRef(getInitialCollapsedState());

  // Modern SVG icon components
  const IconDashboard = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const IconPatients = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const IconAppointments = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const IconQueue = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );

  const IconPrescriptions = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );

  const IconInvoices = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const IconInventory = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const IconReports = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const IconSettings = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconAPI = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );

  const IconLocation = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconBranding = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );

  const IconTelemedicine = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const IconLogout = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const IconAdmin = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const IconClients = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const IconSubscriptions = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );

  const IconSubscription = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const IconPaymentHistory = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );

  // Feature mapping for menu items
  const menuItemsWithFeatures = [
    { href: '/dashboard', labelKey: 'dashboard.title', icon: IconDashboard, requiredFeature: null }, // Dashboard always available
    { href: '/patients', labelKey: 'patients.title', icon: IconPatients, requiredFeature: 'Patient Management' },
    { href: '/appointments', labelKey: 'appointments.title', icon: IconAppointments, requiredFeature: 'Appointment Scheduling' },
    { href: '/queue', labelKey: 'queue.title', icon: IconQueue, requiredFeature: 'Queue Management' },
    { href: '/prescriptions', labelKey: 'prescriptions.title', icon: IconPrescriptions, requiredFeature: 'Prescriptions Management' },
    { href: '/invoices', labelKey: 'invoices.title', icon: IconInvoices, requiredFeature: 'Invoice & Billing' },
    { href: '/inventory', labelKey: 'inventory.title', icon: IconInventory, requiredFeature: 'Inventory Management' },
    { href: '/reports', labelKey: 'reports.title', icon: IconReports, requiredFeature: 'Reports & Analytics' },
    { href: '/telemedicine', label: 'Telemedicine', icon: IconTelemedicine, requiredFeature: 'Telemedicine' },
    { href: '/settings/locations', label: 'Locations', icon: IconLocation, requiredFeature: 'Multi-Location Support' },
    { href: '/api-docs', label: 'API Docs', icon: IconAPI, requiredFeature: 'API Access' },
    { href: '/settings/branding', label: 'Branding', icon: IconBranding, requiredFeature: 'Custom Branding' },
    { href: '/settings/white-label', label: 'White Label', icon: IconBranding, requiredFeature: 'White Label Solution' },
    { href: '/settings', labelKey: 'settings.title', icon: IconSettings, requiredFeature: null }, // Settings always available
  ];

  // Filter menu items based on available features (for non-admin users)
  const menuItems = user?.role === 'super_admin' 
    ? [] // Admin users see only admin menu
    : menuItemsWithFeatures.filter(item => 
        item.requiredFeature === null || hasFeature(item.requiredFeature)
      ).map(({ requiredFeature, ...item }) => item);

  // Update ref when state changes
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  // Ensure collapsed state persists during navigation - prevent any expansion
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true' && !isCollapsed) {
      // Force collapsed state immediately if it should be collapsed
      setIsCollapsed(true);
      isCollapsedRef.current = true;
    } else if (saved !== 'true' && isCollapsed && saved !== null) {
      // Only allow expansion if explicitly not collapsed in storage
      setIsCollapsed(false);
      isCollapsedRef.current = false;
    }
  }, [pathname, isCollapsed]);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
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
      className="bg-gray-900 text-white min-h-screen flex flex-col relative"
      data-collapsed={isCollapsed}
      style={{ 
        width: isCollapsed ? '3.5rem' : '14rem',
        minWidth: isCollapsed ? '3.5rem' : '14rem',
        maxWidth: isCollapsed ? '3.5rem' : '14rem',
        flexShrink: 0,
        flexGrow: 0,
        transition: isCollapsed ? 'none' : 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease',
        overflow: isCollapsed ? 'hidden' : 'visible'
      }}
    >
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-6 z-10 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 border-2 border-gray-700 transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>
      <div className={`p-3 border-b border-gray-800 ${isCollapsed ? 'px-2 py-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <h1 className="text-lg font-bold">{t('common.appName')}</h1>
            {user && (
              <p className="text-xs text-gray-400 mt-0.5">
                {user.firstName} {user.lastName}
              </p>
            )}
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {user?.role === 'super_admin' ? (
          /* Admin Section - Only for super_admin */
          <>
            {!isCollapsed && (
              <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1 px-3">Admin</p>
              </div>
            )}
            <Link
              href="/admin"
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                pathname === '/admin'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? t('admin.dashboard') : ''}
            >
              <span className={isCollapsed ? '' : 'mr-2'}>
                <IconAdmin />
              </span>
              <span className={isCollapsed ? 'hidden' : ''}>{t('admin.dashboard')}</span>
            </Link>
            <Link
              href="/admin/clients"
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                pathname === '/admin/clients'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? t('admin.clients') : ''}
            >
              <span className={isCollapsed ? '' : 'mr-2'}>
                <IconClients />
              </span>
              <span className={isCollapsed ? 'hidden' : ''}>{t('admin.clients')}</span>
            </Link>
            <Link
              href="/admin/subscriptions"
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                pathname === '/admin/subscriptions'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? t('admin.subscriptions') : ''}
            >
              <span className={isCollapsed ? '' : 'mr-2'}>
                <IconSubscriptions />
              </span>
              <span className={isCollapsed ? 'hidden' : ''}>{t('admin.subscriptions')}</span>
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
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? displayLabel : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-2'}`}>
                    {item.icon && <item.icon />}
                  </span>
                  <span className={isCollapsed ? 'hidden' : ''}>{displayLabel}</span>
                </Link>
              );
            })}

            {/* Subscription Section */}
            {!isCollapsed && (
              <div className="pt-2 mt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1 px-3">Subscription</p>
              </div>
            )}
            <Link
              href="/subscription"
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                pathname === '/subscription' || pathname?.startsWith('/subscription/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? t('subscription.title') : ''}
            >
              <span className={isCollapsed ? '' : 'mr-2'}>
                <IconSubscription />
              </span>
              <span className={isCollapsed ? 'hidden' : ''}>{t('subscription.title')}</span>
            </Link>
            <Link
              href="/payment-history"
              onClick={handleLinkClick}
              prefetch={false}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-colors text-sm ${
                pathname === '/payment-history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? t('subscription.paymentHistory') : ''}
            >
              <span className={isCollapsed ? '' : 'mr-2'}>
                <IconPaymentHistory />
              </span>
              <span className={isCollapsed ? 'hidden' : ''}>{t('subscription.paymentHistory')}</span>
            </Link>
          </>
        )}
      </nav>

      <div className={`p-2 border-t border-gray-800 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed && (
          <div className="mb-1">
            <label className="block text-xs text-gray-400 mb-1">
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {t('settings.language')}
            </label>
            <LanguageSwitcher variant="dark" size="sm" />
          </div>
        )}
        {isCollapsed && (
          <div className="mb-1">
            <LanguageSwitcher variant="dark" size="sm" />
          </div>
        )}
        <button
          onClick={() => logout()}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors`}
          title={isCollapsed ? t('auth.logout') : ''}
        >
          <span className={isCollapsed ? '' : 'mr-2'}>
            <IconLogout />
          </span>
          {!isCollapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </div>
  );
}

