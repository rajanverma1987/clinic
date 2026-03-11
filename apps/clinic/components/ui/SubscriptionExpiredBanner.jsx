'use client';

import { InfoIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { Button } from './Button.jsx';

/**
 * Professional subscription status banner: neutral bar, left accent, primary CTA.
 * Used in Layout for non–super-admin users. All copy is i18n.
 *
 * Trial model:
 *  - Registered users get 6 months free.
 *  - During last 15 days of trial: show warning banner (every day until last day).
 *  - After trial expired (trialDaysRemaining <= 0, no subscription): show expired banner.
 */
const TRIAL_WARNING_DAYS = 15; // Show trial-expiring message when ≤ this many days left

export function SubscriptionExpiredBanner({
  subscriptionStatus,
  expiryDate,
  trialDaysRemaining,
  paypalApprovalUrl,
}) {
  const router = useRouter();
  const { t } = useI18n();

  const handleCompletePayment = () => {
    logger.info('Complete Payment clicked');
    if (paypalApprovalUrl) {
      router.push(paypalApprovalUrl);
    } else {
      router.push('/subscription');
    }
  };

  const goToSubscription = () => router.push('/subscription');

  // Active subscription, trial not expiring soon (more than 15 days) → no banner
  if (
    subscriptionStatus === 'ACTIVE' &&
    (!trialDaysRemaining || trialDaysRemaining > TRIAL_WARNING_DAYS)
  ) {
    return null;
  }

  // Active subscription, trial expiring within 15 days → warning (show until last day)
  if (
    subscriptionStatus === 'ACTIVE' &&
    trialDaysRemaining != null &&
    trialDaysRemaining <= TRIAL_WARNING_DAYS
  ) {
    const days = trialDaysRemaining === 1 ? t('common.day') : t('common.days');
    const message = t('subscription.bannerTrialExpiring')
      .replace('{{count}}', String(trialDaysRemaining))
      .replace('{{days}}', days);
    return (
      <div
        className='flex items-start justify-between gap-4 flex-wrap py-3 px-4 sm:px-6 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-600 text-neutral-800 dark:text-amber-100'
        role='alert'
      >
        <div className='flex items-start gap-3 min-w-0 flex-1'>
          <span
            className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center'
            aria-hidden
          >
            <InfoIcon className='icon icon-sm text-amber-600 dark:text-amber-400' ariaHidden />
          </span>
          <p className='text-body-sm font-medium leading-snug break-words min-w-0'>{message}</p>
        </div>
        <Button variant='warning' size='sm' onClick={goToSubscription} className='flex-shrink-0'>
          {t('subscription.upgradeNow')}
        </Button>
      </div>
    );
  }

  // No subscription + still in free trial (days remaining > 0)
  if (!subscriptionStatus && trialDaysRemaining != null && trialDaysRemaining > 0) {
    const days = trialDaysRemaining === 1 ? t('common.day') : t('common.days');
    const daysLeft = trialDaysRemaining <= TRIAL_WARNING_DAYS;
    const message = daysLeft
      ? t('subscription.bannerTrialExpiringSoon')
          .replace('{{count}}', String(trialDaysRemaining))
          .replace('{{days}}', days)
      : t('subscription.bannerTrialActive');
    return (
      <div
        className={`flex items-start justify-between gap-4 flex-wrap py-3 px-4 sm:px-6 border-l-4 ${
          daysLeft
            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 dark:border-amber-600 text-neutral-800 dark:text-amber-100'
            : 'bg-neutral-50 dark:bg-neutral-800/80 border-primary-500 dark:border-primary-400 text-neutral-700 dark:text-neutral-200'
        }`}
        role='status'
      >
        <div className='flex items-start gap-3 min-w-0 flex-1'>
          <span
            className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center'
            aria-hidden
          >
            <InfoIcon className='icon icon-sm text-neutral-600 dark:text-neutral-300' ariaHidden />
          </span>
          <p className='text-body-sm font-medium leading-snug break-words min-w-0'>{message}</p>
        </div>
        {daysLeft && (
          <Button variant='warning' size='sm' onClick={goToSubscription} className='flex-shrink-0'>
            {t('subscription.upgradeNow')}
          </Button>
        )}
      </div>
    );
  }

  // No subscription + trial expired → must subscribe to continue
  if (!subscriptionStatus && (!trialDaysRemaining || trialDaysRemaining <= 0)) {
    return (
      <div
        className='flex items-start justify-between gap-4 flex-wrap py-3 px-4 sm:px-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-neutral-800 dark:text-red-100'
        role='alert'
      >
        <div className='flex items-start gap-3 min-w-0 flex-1'>
          <span
            className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center'
            aria-hidden
          >
            <InfoIcon className='icon icon-sm text-red-600 dark:text-red-400' ariaHidden />
          </span>
          <p className='text-body-sm font-medium leading-snug break-words min-w-0'>
            {t('subscription.bannerTrialEnded')}
          </p>
        </div>
        <Button variant='danger' size='sm' onClick={goToSubscription} className='flex-shrink-0'>
          {t('subscription.upgradeNow')}
        </Button>
      </div>
    );
  }

  // Expired, suspended, or cancelled subscription
  if (
    subscriptionStatus === 'EXPIRED' ||
    subscriptionStatus === 'SUSPENDED' ||
    subscriptionStatus === 'CANCELLED'
  ) {
    const status = subscriptionStatus.toLowerCase();
    const message = t('subscription.bannerExpired').replace('{{status}}', status);
    const dateStr = expiryDate
      ? t('subscription.bannerExpiredOn').replace(
          '{{date}}',
          new Date(expiryDate).toLocaleDateString(),
        )
      : '';
    return (
      <div
        className='flex items-start justify-between gap-4 flex-wrap py-3 px-4 sm:px-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-neutral-800 dark:text-red-100'
        role='alert'
      >
        <div className='flex items-start gap-3 min-w-0 flex-1'>
          <span
            className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center'
            aria-hidden
          >
            <InfoIcon className='icon icon-sm text-red-600 dark:text-red-400' ariaHidden />
          </span>
          <p className='text-body-sm font-medium leading-snug break-words min-w-0'>
            {message}
            {dateStr && ` ${dateStr}`}
          </p>
        </div>
        <Button variant='danger' size='sm' onClick={goToSubscription} className='flex-shrink-0'>
          {t('subscription.renewNow')}
        </Button>
      </div>
    );
  }

  // Pending
  if (subscriptionStatus === 'PENDING') {
    return (
      <div
        className='flex items-start justify-between gap-4 flex-wrap py-3 px-4 sm:px-6 bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500 dark:border-primary-400 text-neutral-800 dark:text-primary-100'
        role='alert'
      >
        <div className='flex items-start gap-3 min-w-0 flex-1'>
          <span
            className='flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center'
            aria-hidden
          >
            <InfoIcon className='icon icon-sm text-primary-600 dark:text-primary-400' ariaHidden />
          </span>
          <p className='text-body-sm font-medium leading-snug break-words min-w-0'>
            {t('subscription.bannerPending')}
          </p>
        </div>
        <Button
          variant='primary'
          size='sm'
          onClick={handleCompletePayment}
          className='flex-shrink-0'
        >
          {t('subscription.completePayment')}
        </Button>
      </div>
    );
  }

  return null;
}
