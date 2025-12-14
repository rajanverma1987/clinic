'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Button } from './Button.jsx';
import { FaCheck, FaUsers, FaUser, FaDatabase } from 'react-icons/fa';

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
  onSelect,
  ctaText = 'Select Plan',
  ctaDisabled = false,
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
  const hasDiscount = originalPrice && originalPrice !== price;

  return (
    <div
      className={`relative flex flex-col h-full rounded-xl border-2 transition-all duration-300 group overflow-hidden ${
        isPopular
          ? 'border-primary-500 bg-white shadow-xl scale-[1.02] hover:scale-[1.03]'
          : isCurrent
          ? 'border-secondary-500 bg-gradient-to-br from-secondary-50/50 to-white shadow-lg'
          : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-lg'
      } ${className}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600'></div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-600'></div>
      )}

      {/* Popular/Current Badge Label */}
      {(isPopular || isCurrent) && (
        <div className='absolute top-4 right-4 z-10'>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
              isPopular
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                : 'bg-gradient-to-r from-secondary-600 to-secondary-500 text-white'
            }`}
          >
            {isPopular ? t('pricing.mostPopular') : t('pricing.currentPlan')}
          </div>
        </div>
      )}

      <div className='p-6 flex-1 flex flex-col'>
        {/* Header */}
        <div className='mb-6'>
          <h3 className='text-h3 font-bold text-neutral-900 mb-2'>{name}</h3>
          {description && (
            <p className='text-body-sm text-neutral-600 leading-relaxed'>{description}</p>
          )}
        </div>

        {/* Price Section */}
        <div className='mb-6 pb-6 border-b border-neutral-200'>
          {price === 0 ? (
            <div className='flex items-baseline'>
              <span className='text-5xl font-bold text-neutral-900'>{t('pricing.free')}</span>
            </div>
          ) : (
            <>
              {/* Show original price if discounted */}
              {hasDiscount && (
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-xl font-medium text-neutral-400 line-through'>
                    {formatPrice(originalPrice, currency)}
                  </span>
                  <span className='inline-flex items-center bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded text-xs font-semibold'>
                    Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%
                  </span>
                </div>
              )}
              <div className='flex items-baseline gap-2'>
                <span className='text-5xl font-bold text-neutral-900'>
                  {formatPrice(price, currency)}
                </span>
                <span className='text-neutral-500 text-body-md font-medium'>/{billingPeriod}</span>
              </div>
            </>
          )}
        </div>

        {/* Features List */}
        <div className='flex-1 mb-6'>
          <ul className='space-y-3'>
            {Array.isArray(features) &&
              features.map((feature, index) => (
                <li key={index} className='flex items-start'>
                  <div className='flex-shrink-0 w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center mr-3 mt-0.5'>
                    <FaCheck className='text-secondary-600' style={{ fontSize: '10px' }} />
                  </div>
                  <span className='text-body-sm text-neutral-700 leading-relaxed'>{feature}</span>
                </li>
              ))}

            {/* Usage Limits */}
            {maxUsers && (
              <li className='flex items-start pt-2 border-t border-neutral-100 mt-3'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mr-3 mt-0.5'>
                  <FaUsers className='text-primary-600' style={{ fontSize: '12px' }} />
                </div>
                <span className='text-body-sm text-neutral-700 leading-relaxed'>
                  <strong className='font-semibold text-neutral-900'>{maxUsers}</strong>{' '}
                  {t('pricing.teamMembers')}
                </span>
              </li>
            )}

            {maxPatients && (
              <li className='flex items-start'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mr-3 mt-0.5'>
                  <FaUser className='text-primary-600' style={{ fontSize: '12px' }} />
                </div>
                <span className='text-body-sm text-neutral-700 leading-relaxed'>
                  {t('pricing.upToPatients')}{' '}
                  <strong className='font-semibold text-neutral-900'>
                    {maxPatients.toLocaleString()}
                  </strong>{' '}
                  {t('pricing.patients')}
                </span>
              </li>
            )}

            {maxStorageGB && (
              <li className='flex items-start'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-status-warning/20 flex items-center justify-center mr-3 mt-0.5'>
                  <FaDatabase className='text-status-warning' style={{ fontSize: '12px' }} />
                </div>
                <span className='text-body-sm text-neutral-700 leading-relaxed'>
                  <strong className='font-semibold text-neutral-900'>{maxStorageGB}GB</strong>{' '}
                  {t('pricing.storage')}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        {onSelect && (
          <Button
            variant={isPopular ? 'primary' : isCurrent ? 'secondary' : 'secondary'}
            size='md'
            className='w-full'
            onClick={onSelect}
            disabled={ctaDisabled}
          >
            {ctaText}
          </Button>
        )}
        {isCurrent && !onSelect && (
          <div className='w-full px-4 py-3 bg-secondary-100 text-secondary-700 rounded-lg text-center text-body-sm font-semibold'>
            {t('pricing.currentPlan')}
          </div>
        )}
      </div>

      {/* Decorative gradient overlay on hover for popular */}
      {isPopular && (
        <div className='absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>
      )}
    </div>
  );
}
