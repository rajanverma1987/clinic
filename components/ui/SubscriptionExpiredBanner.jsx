'use client';

import { useRouter } from 'next/navigation';
import { InfoIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { Button } from './Button.jsx';

/**
 * Professional subscription status banner: neutral bar, left accent, primary CTA.
 * Used in Layout for non–super-admin users. All copy is i18n.
 */
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
      window.location.href = paypalApprovalUrl;
    } else {
      router.push('/subscription');
    }
  };

  const goToSubscription = () => router.push('/subscription');

  // Don't show banner if subscription is active and trial is fine
  if (subscriptionStatus === 'ACTIVE' && (!trialDaysRemaining || trialDaysRemaining > 3)) {
    return null;
  }

  // Trial expiring soon
  if (subscriptionStatus === 'ACTIVE' && trialDaysRemaining != null && trialDaysRemaining <= 3) {
    const days = trialDaysRemaining === 1 ? t('common.day') || 'day' : t('common.days') || 'days';
    const message = t('subscription.bannerTrialExpiring')
      .replace('{{count}}', String(trialDaysRemaining))
      .replace('{{days}}', days);
    return (
      <div
        className="flex items-center justify-between gap-4 flex-wrap py-3 px-4 bg-amber-50 border-l-4 border-amber-500 text-neutral-800"
        role="alert"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center" aria-hidden>
            <InfoIcon className="icon icon-sm text-amber-600" ariaHidden />
          </span>
          <p className="text-body-sm font-medium">{message}</p>
        </div>
        <Button variant="warning" size="sm" onClick={goToSubscription}>
          {t('subscription.upgradeNow')}
        </Button>
      </div>
    );
  }

  // Expired, suspended, or cancelled
  if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'SUSPENDED' || subscriptionStatus === 'CANCELLED') {
    const status = subscriptionStatus.toLowerCase();
    const message = t('subscription.bannerExpired').replace('{{status}}', status);
    const dateStr = expiryDate ? t('subscription.bannerExpiredOn').replace('{{date}}', new Date(expiryDate).toLocaleDateString()) : '';
    return (
      <div
        className="flex items-center justify-between gap-4 flex-wrap py-3 px-4 bg-red-50 border-l-4 border-red-500 text-neutral-800"
        role="alert"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center" aria-hidden>
            <InfoIcon className="icon icon-sm text-red-600" ariaHidden />
          </span>
          <p className="text-body-sm font-medium">
            {message}
            {dateStr && ` ${dateStr}`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={goToSubscription}>
          {t('subscription.renewNow')}
        </Button>
      </div>
    );
  }

  // Pending
  if (subscriptionStatus === 'PENDING') {
    return (
      <div
        className="flex items-center justify-between gap-4 flex-wrap py-3 px-4 bg-primary-50 border-l-4 border-primary-500 text-neutral-800"
        role="alert"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center" aria-hidden>
            <InfoIcon className="icon icon-sm text-primary-600" ariaHidden />
          </span>
          <p className="text-body-sm font-medium">{t('subscription.bannerPending')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleCompletePayment}>
          {t('subscription.completePayment')}
        </Button>
      </div>
    );
  }

  // No subscription
  if (!subscriptionStatus) {
    return (
      <div
        className="flex items-center justify-between gap-4 flex-wrap py-3 px-4 bg-neutral-50 border-l-4 border-primary-500 text-neutral-700"
        role="alert"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center" aria-hidden>
            <InfoIcon className="icon icon-sm text-neutral-600" ariaHidden />
          </span>
          <p className="text-body-sm font-medium">{t('subscription.bannerNoSubscription')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={goToSubscription}>
          {t('subscription.viewPlans')}
        </Button>
      </div>
    );
  }

  return null;
}
