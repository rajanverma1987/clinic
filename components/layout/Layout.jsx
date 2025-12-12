'use client';

import { WelcomeNotification } from '@/components/notifications/WelcomeNotification';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionExpiredBanner } from '@/components/ui/SubscriptionExpiredBanner.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar.jsx';

export function Layout({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { subscription } = useFeatures();
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);

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

  return (
    <div
      className='flex min-h-screen'
      style={{ backgroundColor: 'var(--color-neutral-50)', gap: '10px' }}
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
      <main className='flex-1 overflow-x-hidden'>
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
        <div className='p-0 m-0'>{children}</div>
      </main>
    </div>
  );
}
