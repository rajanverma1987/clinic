'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Button } from './Button.jsx';

/** Max feature lines shown on card to keep layout clean */
const MAX_FEATURES_ON_CARD = 8;

/** Treat as "Unlimited" in UI */
const UNLIMITED_USERS_THRESHOLD = 500;
const UNLIMITED_PATIENTS_THRESHOLD = 500000;
const UNLIMITED_STORAGE_THRESHOLD = 5000;

export function SubscriptionCard({
  name,
  description,
  price,
  originalPrice,
  currency,
  billingCycle,
  features = [],
  maxUsers,
  maxPatients,
  maxStorageGB,
  isPopular = false,
  isCurrent = false,
  yearlySaveAmount,
  trialDays,
  onSelect,
  onPayWithCard,
  onPayWithPayPal,
  ctaText: ctaTextProp,
  ctaLabel: ctaLabelProp, // optional alias for ctaText; use ctaText only in render to avoid ReferenceError
  ctaDisabled = false,
  showPaymentMethods = false,
  loadingCard = false,
  loadingPayPal = false,
  className = '',
}) {
  const { t } = useI18n();

  const formatPrice = (amount, curr) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const billingPeriod = billingCycle === 'MONTHLY' ? t('pricing.perMonth') : t('pricing.perYear');
  const isPaid = price > 0;

  const displayFeatures = Array.isArray(features) ? features.slice(0, MAX_FEATURES_ON_CARD) : [];
  const displayMaxUsers =
    maxUsers != null && maxUsers >= UNLIMITED_USERS_THRESHOLD ? null : maxUsers;
  const displayMaxPatients =
    maxPatients != null && maxPatients >= UNLIMITED_PATIENTS_THRESHOLD ? null : maxPatients;
  const displayMaxStorageGB =
    maxStorageGB != null && maxStorageGB >= UNLIMITED_STORAGE_THRESHOLD ? null : maxStorageGB;

  const cardMod = isPopular ? 'sub-plan-card--popular' : isCurrent ? 'sub-plan-card--current' : '';

  return (
    <div className={`sub-plan-card ${cardMod} ${className}`.trim()}>
      {isPopular && (
        <div className='sub-plan-card__badge sub-plan-card__badge--popular'>
          {t('subscriptionSpec.mostPopular')}
        </div>
      )}
      {isCurrent && (
        <div className='sub-plan-card__badge sub-plan-card__badge--current'>
          {t('pricing.currentPlan')}
        </div>
      )}

      <div className='sub-plan-card__body'>
        <div className='sub-plan-card__header'>
          <h3 className='sub-plan-card__name'>{name}</h3>
          {description && <p className='sub-plan-card__desc'>{description}</p>}
        </div>

        <div className='sub-plan-card__price'>
          {price === 0 ? (
            <span className='sub-plan-card__price-value'>{t('pricing.free')}</span>
          ) : (
            <>
              {originalPrice != null && originalPrice > price && (
                <div className='sub-plan-card__price-original'>
                  {formatPrice(originalPrice, currency)}/{billingPeriod}
                </div>
              )}
              <span className='sub-plan-card__price-value'>{formatPrice(price, currency)}</span>
              <span className='sub-plan-card__price-period'>/{billingPeriod}</span>
              {yearlySaveAmount != null && yearlySaveAmount > 0 && billingCycle === 'MONTHLY' && (
                <p className='sub-plan-card__save'>
                  {t('subscriptionSpec.saveAmount').replace('{{amount}}', String(yearlySaveAmount))}{' '}
                  {t('subscriptionSpec.perYear')}
                </p>
              )}
              {billingCycle === 'YEARLY' &&
                isPaid &&
                originalPrice != null &&
                originalPrice > price && (
                  <span className='sub-plan-card__save-badge'>{t('pricing.save20')}</span>
                )}
            </>
          )}
        </div>

        {trialDays != null && trialDays > 0 && (
          <div className='sub-plan-card__trial'>
            <p className='sub-plan-card__trial-line'>
              {t('subscriptionSpec.trialDaysFree').replace('{{days}}', String(trialDays))}
            </p>
            <p className='sub-plan-card__trial-billing'>
              {t('subscriptionSpec.trialThenBilling')
                .replace('{{days}}', String(trialDays))
                .replace('{{planName}}', name)
                .replace(
                  '{{amount}}',
                  price > 0
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency || 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(price / 100)
                    : '',
                )}
            </p>
          </div>
        )}

        <ul className='sub-plan-card__features'>
          {displayFeatures.map((feature, index) => (
            <li key={index} className='sub-plan-card__feature'>
              <span className='sub-plan-card__feature-check' aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
          {maxUsers != null && (
            <li className='sub-plan-card__feature'>
              <span className='sub-plan-card__feature-check' aria-hidden />
              <span>
                {displayMaxUsers != null ? (
                  <>
                    <strong>{displayMaxUsers}</strong>
                  </>
                ) : (
                  <strong>{t('pricing.unlimited')}</strong>
                )}{' '}
                {t('pricing.teamMembers')}
              </span>
            </li>
          )}
          {maxPatients != null && (
            <li className='sub-plan-card__feature'>
              <span className='sub-plan-card__feature-check' aria-hidden />
              <span>
                {t('pricing.upToPatients')}{' '}
                {displayMaxPatients != null ? (
                  <strong>{displayMaxPatients.toLocaleString()}</strong>
                ) : (
                  <strong>{t('pricing.unlimited')}</strong>
                )}{' '}
                {t('pricing.patients')}
              </span>
            </li>
          )}
          {maxStorageGB != null && (maxStorageGB > 0 || displayMaxStorageGB == null) && (
            <li className='sub-plan-card__feature'>
              <span
                className='sub-plan-card__feature-check sub-plan-card__feature-check--storage'
                aria-hidden
              />
              <span>
                {displayMaxStorageGB != null && displayMaxStorageGB > 0 ? (
                  <>
                    <strong>{displayMaxStorageGB}GB</strong>
                  </>
                ) : (
                  <strong>{t('pricing.unlimited')}</strong>
                )}{' '}
                {t('pricing.storage')}
              </span>
            </li>
          )}
        </ul>

        {showPaymentMethods && onPayWithCard && onPayWithPayPal && isPaid ? (
          <div className='sub-plan-card__cta-group'>
            <p className='sub-plan-card__secure-note' role='status'>
              {t('subscription.securePaymentNote')}
            </p>
            <Button
              variant='primary'
              size='md'
              className='sub-plan-card__cta'
              onClick={onPayWithCard}
              disabled={ctaDisabled || loadingPayPal}
              isLoading={loadingCard}
            >
              {t('subscription.payWithCard')}
            </Button>
            <Button
              variant='secondary'
              size='md'
              className='sub-plan-card__cta sub-plan-card__cta--secondary'
              onClick={onPayWithPayPal}
              disabled={ctaDisabled || loadingCard}
              isLoading={loadingPayPal}
            >
              {t('subscription.payWithPayPal')}
            </Button>
          </div>
        ) : onSelect ? (
          <Button
            variant={isPopular ? 'primary' : isCurrent ? 'secondary' : 'secondary'}
            size='md'
            className='sub-plan-card__cta'
            onClick={onSelect}
            disabled={ctaDisabled}
          >
            {ctaTextProp ?? ctaLabelProp ?? t('pricing.getStarted')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
