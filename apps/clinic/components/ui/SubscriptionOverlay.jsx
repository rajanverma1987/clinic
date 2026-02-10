'use client';

import { InfoIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from './Button.jsx';

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
  const { t } = useI18n();
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

  const goToSubscription = () => router.push('/subscription');

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
  let buttonAction = goToSubscription;
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
  // No subscription
  else if (!subscriptionStatus) {
    message = t('subscription.bannerNoSubscription');
    buttonText = t('subscription.viewPlans');
  }

  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      role='alert'
      aria-live='polite'
    >
      <div
        className={`${bgColor} ${borderColor} ${textColor} rounded-lg shadow-xl border-l-4 p-2.5 flex items-start gap-2.5`}
      >
        <span className='flex-shrink-0 w-4 h-4 mt-0.5' aria-hidden>
          <InfoIcon className='icon icon-xs text-current' ariaHidden />
        </span>
        <div className='flex-1 min-w-0'>
          <p className='text-xs font-medium leading-snug mb-1.5 pr-1'>{message}</p>
          <div className='flex items-center gap-2'>
            <Button
              variant='primary'
              size='xs'
              onClick={buttonAction}
              className='!text-xs !px-2.5 !py-1 !h-7 !min-h-0 flex-shrink-0'
            >
              {buttonText}
            </Button>
            <button
              onClick={handleDismiss}
              className='text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex-shrink-0'
              aria-label='Dismiss'
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
