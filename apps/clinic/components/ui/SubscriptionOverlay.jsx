'use client';

import { InfoIcon } from '@/components/icons';
import { useI18nOptional } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Compact subscription overlay in bottom-right corner.
 * Shows subscription status as a small, dismissible notification.
 */
export function SubscriptionOverlay({
  subscriptionStatus,
  expiryDate,
  trialDaysRemaining,
  paypalApprovalUrl,
}) {
  const router = useRouter();
  const { t } = useI18nOptional();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show overlay after 2 seconds delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCompletePayment = () => {
    logger.info('Complete Payment clicked');
    if (paypalApprovalUrl) {
      window.location.href = paypalApprovalUrl;
    } else {
      router.push('/subscription');
    }
  };

  /** Send to pricing so user can subscribe with current account; purchase syncs via /features refetch on return. */
  const goToPlans = () => router.push('/pricing');

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Don't show if subscription is active and trial is fine
  if (subscriptionStatus === 'ACTIVE' && (!trialDaysRemaining || trialDaysRemaining > 3)) {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  // Determine message and button based on status
  let message = '';
  let buttonText = '';
  let buttonAction = goToPlans;
  let bgColor = 'bg-neutral-50 dark:bg-neutral-800';
  let borderColor = 'border-primary-500 dark:border-primary-400';
  let textColor = 'text-neutral-700 dark:text-neutral-200';

  // Trial expiring soon
  if (subscriptionStatus === 'ACTIVE' && trialDaysRemaining != null && trialDaysRemaining <= 3) {
    const days = trialDaysRemaining === 1 ? t('common.day') || 'day' : t('common.days') || 'days';
    message = t('subscription.bannerTrialExpiring')
      .replace('{{count}}', String(trialDaysRemaining))
      .replace('{{days}}', days);
    buttonText = t('subscription.upgradeNow');
    bgColor = 'bg-amber-50 dark:bg-amber-900/30';
    borderColor = 'border-amber-500 dark:border-amber-600';
    textColor = 'text-neutral-800 dark:text-amber-100';
  }
  // Expired, suspended, or cancelled
  else if (
    subscriptionStatus === 'EXPIRED' ||
    subscriptionStatus === 'SUSPENDED' ||
    subscriptionStatus === 'CANCELLED'
  ) {
    const status = subscriptionStatus.toLowerCase();
    message = t('subscription.bannerExpired').replace('{{status}}', status);
    buttonText = t('subscription.renewNow');
    bgColor = 'bg-red-50 dark:bg-red-900/30';
    borderColor = 'border-red-500 dark:border-red-600';
    textColor = 'text-neutral-800 dark:text-red-100';
  }
  // Pending
  else if (subscriptionStatus === 'PENDING') {
    message = t('subscription.bannerPending');
    buttonText = t('subscription.completePayment');
    buttonAction = handleCompletePayment;
    bgColor = 'bg-primary-50 dark:bg-primary-900/30';
    borderColor = 'border-primary-500 dark:border-primary-400';
    textColor = 'text-neutral-800 dark:text-primary-100';
  }
  // No subscription → View Plans goes to pricing (logged-in); purchase syncs on return
  else if (!subscriptionStatus) {
    message = t('subscription.bannerNoSubscription');
    buttonText = t('subscription.viewPlans');
  }

  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-[min(28rem,calc(100vw-2rem))] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      role='alert'
      aria-live='polite'
    >
      <div
        className={`${bgColor} ${borderColor} ${textColor} rounded-lg shadow-md border-l-4 px-4 py-3 flex items-start gap-3`}
      >
        <span
          className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-600/80 flex items-center justify-center'
          aria-hidden
        >
          <InfoIcon className='icon icon-sm text-current' ariaHidden />
        </span>
        <p className='text-body-sm font-medium leading-snug flex-1 min-w-0 break-words'>
          {message}
        </p>
        <div className='flex flex-shrink-0 items-center gap-2'>
          <button
            type='button'
            onClick={buttonAction}
            className='text-xs font-medium px-3 py-1.5 h-8 min-h-0 rounded-lg bg-[#15803d] text-white border border-white shadow-[0_0_0_0.5px_#15803d] hover:bg-primary-500 active:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200'
          >
            {buttonText}
          </button>
          <button
            onClick={handleDismiss}
            className='w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition-colors'
            aria-label={t('common.ariaLabelDismiss')}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
