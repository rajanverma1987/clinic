'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { SubscriptionExpiredBanner } from '@/components/ui/SubscriptionExpiredBanner';

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { subscription } = useFeatures();

  // Debug logging
  if (subscription) {
    console.log('Subscription data in Layout:', subscription);
  }

  // Don't show subscription banner for super admin
  const showSubscriptionBanner = user && user.role !== 'super_admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 transition-all duration-300">
        {showSubscriptionBanner && subscription && (
          <SubscriptionExpiredBanner
            subscriptionStatus={subscription.status}
            expiryDate={subscription.currentPeriodEnd}
            trialDaysRemaining={subscription.trialDaysRemaining}
            paypalApprovalUrl={subscription.paypalApprovalUrl}
          />
        )}
        {showSubscriptionBanner && !subscription && (
          <SubscriptionExpiredBanner
            subscriptionStatus={null}
          />
        )}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

