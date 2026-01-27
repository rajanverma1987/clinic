'use client';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { WelcomeNotification } from '@/components/notifications/WelcomeNotification';
import GlobalSearch from '@/components/search/GlobalSearch';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionExpiredBanner } from '@/components/ui/SubscriptionExpiredBanner.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useEffect, useState } from 'react';
import { PageHeader } from './PageHeader';
import { Sidebar } from './Sidebar.jsx';

/**
 * Layout wraps sidebar + main content. Optional title/subtitle/actionButton (or actionButtons)
 * render PageHeader above children so admin and other pages get the same sticky header
 * without each page importing PageHeader.
 */
export function Layout({
  children,
  title,
  subtitle,
  actionButton,
  actionButtons,
}) {
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useFeatures();
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
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
      className='layout-root'
      style={{
        display: 'flex',
        minHeight: '100vh',
        gap: 0,
        backgroundColor: 'var(--color-neutral-50)',
      }}
    >
      {/* Show loader overlay while auth is checking, but don't block layout structure */}
      {authLoading && (
        <div
          className='fixed inset-0 flex items-center justify-center'
          style={{
            zIndex: 'var(--z-loader, 10070)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Loader size='lg' />
        </div>
      )}
      <Sidebar />
      <main className='flex-1 flex flex-col min-w-0'>
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
