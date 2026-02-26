'use client';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { WelcomeNotification } from '@/components/notifications/WelcomeNotification';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionExpiredBanner } from '@/components/ui/SubscriptionExpiredBanner.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts';
import { apiClient } from '@/lib/api/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Sidebar } from './Sidebar.jsx';

/**
 * Layout wraps sidebar + main content. Optional title/subtitle/actionButton (or actionButtons)
 * render PageHeader above children so admin and other pages get the same sticky header
 * without each page importing PageHeader.
 * When loading=true, shows section loader in content area (sidebar + header stay visible).
 * When loading=true and skeleton is provided, shows layout-matched skeleton instead of spinner.
 */
export function Layout({
  children,
  title,
  subtitle,
  actionButton,
  actionButtons,
  loading = false,
  loadingText,
  skeleton,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, loading: authLoading, loggingOut } = useAuth();
  const { subscription } = useFeatures();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const maintenanceCheckInFlightRef = useRef(false);

  useAppKeyboardShortcuts({ onOpenSearch: () => setShowSearch(true) });

  // Maintenance mode: redirect non–super_admin to /maintenance when platform is in maintenance
  useEffect(() => {
    if (authLoading || !user || user.role === 'super_admin' || pathname === '/maintenance') return;
    if (maintenanceCheckInFlightRef.current) return;
    let cancelled = false;
    maintenanceCheckInFlightRef.current = true;
    apiClient
      .get('/maintenance-status', undefined, true)
      .then((res) => {
        if (cancelled || !res?.success || !res?.data?.maintenanceMode) return;
        router.replace('/maintenance');
      })
      .finally(() => {
        maintenanceCheckInFlightRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, pathname, router]);

  // Global keyboard shortcuts and custom events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close modals and mobile sidebar
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setSidebarMobileOpen(false);
      }
      // N key for notifications
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        const target = e.target;
        // Only open if not typing in an input/textarea
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowNotifications(true);
        }
      }
    };

    const handleOpenNotifications = () => {
      setShowNotifications(true);
    };

    const handleOpenSearch = () => {
      setShowSearch(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openNotifications', handleOpenNotifications);
    window.addEventListener('openSearch', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openNotifications', handleOpenNotifications);
      window.removeEventListener('openSearch', handleOpenSearch);
    };
  }, []);

  // Show full-screen loader during initial auth loading or logout (covers everything including sidebar/header)
  if (authLoading || loggingOut) {
    return <Loader fullScreen size='lg' text={loggingOut ? t('auth.signingOut') : undefined} />;
  }

  return (
    <div
      className='layout-root bg-neutral-50 dark:bg-neutral-900'
      style={{
        display: 'flex',
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        gap: 0,
      }}
    >
      <Sidebar isMobileOpen={sidebarMobileOpen} onMobileClose={() => setSidebarMobileOpen(false)} />
      <main
        className='flex-1 flex flex-col min-w-0 min-h-0'
        style={{ position: 'relative', zIndex: 0 }}
      >
        {/* Welcome Notification - shows after login */}
        <WelcomeNotification />
        <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden' data-main-scroll>
          <div className='page-shell'>
            {/* Mobile: hamburger to open sidebar (touch target min 44px) */}
            <div className='md:hidden flex items-center h-12 min-h-[44px] px-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'>
              <Button
                type='button'
                variant='ghost'
                className='p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                onClick={() => setSidebarMobileOpen(true)}
                aria-label={t('common.ariaLabelOpenMenu')}
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
                  aria-hidden
                >
                  <line x1='3' y1='6' x2='21' y2='6' />
                  <line x1='3' y1='12' x2='21' y2='12' />
                  <line x1='3' y1='18' x2='21' y2='18' />
                </svg>
              </Button>
            </div>
            {/* Subscription status banner – top of content, full width, no cut-off */}
            {user && user.role !== 'super_admin' && (
              <SubscriptionExpiredBanner
                subscriptionStatus={subscription?.status ?? null}
                expiryDate={subscription?.currentPeriodEnd}
                trialDaysRemaining={subscription?.trialDaysRemaining}
                paypalApprovalUrl={subscription?.paypalApprovalUrl}
              />
            )}
            {title != null && title !== '' && (
              <PageHeader
                title={title}
                subtitle={subtitle}
                actionButtons={actionButton ?? actionButtons}
                showNotifications={true}
                onOpenNotifications={() => setShowNotifications(true)}
                unreadCount={unreadNotificationCount}
                onOpenSearch={() => setShowSearch(true)}
              />
            )}
            {/* Page-specific loading: layout-matched skeleton or section loader */}
            {loading ? (
              skeleton ? (
                <div role='status' aria-busy='true' aria-label={loadingText ?? t('common.loading')}>
                  {skeleton}
                </div>
              ) : (
                <div
                  className='flex items-center justify-center min-h-[calc(100vh-12rem)]'
                  role='status'
                  aria-busy='true'
                  aria-label={loadingText ?? t('common.loading')}
                >
                  <Loader type='section' size='lg' text={loadingText ?? t('common.loading')} />
                </div>
              )
            ) : (
              children
            )}
          </div>
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        unreadCount={unreadNotificationCount}
        onUnreadCountChange={setUnreadNotificationCount}
      />

      {/* Subscription overlay only when banner is not shown (e.g. delayed dismissible toast) – optional; primary placement is inline banner above */}
    </div>
  );
}
