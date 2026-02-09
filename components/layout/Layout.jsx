'use client';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { WelcomeNotification } from '@/components/notifications/WelcomeNotification';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionExpiredBanner } from '@/components/ui/SubscriptionExpiredBanner.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Sidebar } from './Sidebar.jsx';

/**
 * Layout wraps sidebar + main content. Optional title/subtitle/actionButton (or actionButtons)
 * render PageHeader above children so admin and other pages get the same sticky header
 * without each page importing PageHeader.
 */
export function Layout({ children, title, subtitle, actionButton, actionButtons }) {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useFeatures();
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Show subscription banner after 2 seconds (only for non-super-admin users)
  useEffect(() => {
    const shouldShowBanner = user && user.role !== 'super_admin';
    if (shouldShowBanner) {
      const timer = setTimeout(() => {
        setShowSubscriptionBanner(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowSubscriptionBanner(false);
    }
  }, [user]);

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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openNotifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openNotifications', handleOpenNotifications);
    };
  }, []);

  return (
    <div
      className='layout-root bg-neutral-50 dark:bg-neutral-900'
      style={{
        display: 'flex',
        minHeight: '100vh',
        gap: 0,
      }}
    >
      {/* Show loader overlay while auth is checking, but don't block layout structure */}
      {authLoading && (
        <div
          className='fixed inset-0 flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm'
          style={{ zIndex: 'var(--z-loader, 10070)' }}
        >
          <Loader type='page' text={t('common.loading')} />
        </div>
      )}
      <Sidebar isMobileOpen={sidebarMobileOpen} onMobileClose={() => setSidebarMobileOpen(false)} />
      <main className='flex-1 flex flex-col min-w-0' style={{ position: 'relative', zIndex: 0 }}>
        {showSubscriptionBanner && subscription && (
          <div
            className={`transition-all duration-500 ${
              showSubscriptionBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <SubscriptionExpiredBanner
              subscriptionStatus={subscription.status}
              expiryDate={subscription.currentPeriodEnd}
              trialDaysRemaining={subscription.trialDaysRemaining}
              paypalApprovalUrl={subscription.paypalApprovalUrl}
            />
          </div>
        )}
        {showSubscriptionBanner && !subscription && (
          <div
            className={`transition-all duration-500 ${
              showSubscriptionBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <SubscriptionExpiredBanner subscriptionStatus={null} />
          </div>
        )}
        {/* Welcome Notification - shows after login */}
        <WelcomeNotification />
        <div
          className='flex-1 overflow-y-auto overflow-x-hidden'
          data-main-scroll
          style={{ minHeight: 0 }}
        >
          <div className='page-shell' style={{ paddingTop: '5px' }}>
            {/* Mobile: hamburger to open sidebar (touch target min 44px) */}
            <div className='md:hidden flex items-center h-12 min-h-[44px] px-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'>
              <button
                type='button'
                onClick={() => setSidebarMobileOpen(true)}
                className='p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 aria-label="Open menu"'
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
              </button>
            </div>
            {title != null && title !== '' && (
              <PageHeader
                title={title}
                subtitle={subtitle}
                actionButtons={actionButton ?? actionButtons}
                showNotifications={true}
              />
            )}
            {children}
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
    </div>
  );
}
