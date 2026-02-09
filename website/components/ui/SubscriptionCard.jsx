'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Button } from './Button.jsx';

const MAX_FEATURES_ON_CARD = 8;

export function SubscriptionCard({
  name,
  description,
  price,
  originalPrice,
  currency = 'USD',
  billingCycle,
  features = [],
  isPopular = false,
  yearlySaveAmount,
  trialDays = 14,
  onSelect,
  ctaText,
  ctaDisabled = false,
  className = '',
}) {
  const { t } = useI18n();

  const formatPrice = (amount, curr) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);

  const billingPeriod = billingCycle === 'MONTHLY' ? t('pricing.perMonth') : t('pricing.perYear');
  const isPaid = price > 0;
  const displayFeatures = Array.isArray(features) ? features.slice(0, MAX_FEATURES_ON_CARD) : [];
  const cardMod = isPopular ? 'sub-plan-card--popular' : '';

  return (
    <div className={`sub-plan-card ${cardMod} ${className}`.trim()}>
      {isPopular && (
        <div className='sub-plan-card__badge sub-plan-card__badge--popular'>
          {t('subscriptionSpec.mostPopular')}
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
                  {t('subscriptionSpec.saveAmount')?.replace?.(
                    '{{amount}}',
                    String(yearlySaveAmount),
                  )}{' '}
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
              {t('subscriptionSpec.trialDaysFree')?.replace?.('{{days}}', String(trialDays))}
            </p>
            <p className='sub-plan-card__trial-billing'>
              {t('subscriptionSpec.trialThenBilling')
                ?.replace?.('{{days}}', String(trialDays))
                ?.replace?.('{{planName}}', name)
                ?.replace?.('{{amount}}', price > 0 ? formatPrice(price, currency) : '')}
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
        </ul>
        {onSelect && (
          <Button
            variant={isPopular ? 'primary' : 'secondary'}
            size='md'
            className='sub-plan-card__cta'
            onClick={onSelect}
            disabled={ctaDisabled}
          >
            {ctaText ?? t('pricing.getStarted')}
          </Button>
        )}
      </div>
    </div>
  );
}
