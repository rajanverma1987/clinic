'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Button } from './Button.jsx';

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

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        isPopular
          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-white shadow-lg scale-105'
          : isCurrent
          ? 'border-secondary-500 bg-gradient-to-br from-secondary-50 to-white'
          : 'border-neutral-200 bg-white hover:border-primary-300'
      } ${className}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className='absolute -top-4 left-1/2 z-10' style={{ marginLeft: '-50%' }}>
          <div className='bg-gradient-to-r from-primary-700 to-primary-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-md'>
            {t('pricing.mostPopular')}
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className='absolute -top-4 left-1/2 z-10' style={{ marginLeft: '-50%' }}>
          <div className='bg-gradient-to-r from-secondary-700 to-secondary-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-md'>
            {t('pricing.currentPlan')}
          </div>
        </div>
      )}

      <div className='p-8 flex-1 flex flex-col'>
        {/* Header */}
        <div className='mb-6'>
          <h3 className='text-2xl font-bold text-neutral-900 mb-2'>{name}</h3>
          {description && <p className='text-neutral-600 text-sm leading-relaxed'>{description}</p>}
        </div>

        {/* Price */}
        <div className='mb-8'>
          {price === 0 ? (
            <div className='flex items-baseline'>
              <span className='text-5xl font-bold text-neutral-900'>{t('pricing.free')}</span>
            </div>
          ) : (
            <>
              {/* Show original price if discounted */}
              {originalPrice && originalPrice !== price && (
                <div className='flex items-baseline mb-2'>
                  <span className='text-2xl font-medium text-neutral-400 line-through'>
                    {formatPrice(originalPrice, currency)}
                  </span>
                  <span className='text-neutral-400 ml-1 text-sm'>/{billingPeriod}</span>
                </div>
              )}
              <div className='flex items-baseline'>
                <span className='text-5xl font-bold text-neutral-900'>
                  {formatPrice(price, currency)}
                </span>
                <span className='text-neutral-600 ml-2 text-lg'>/{billingPeriod}</span>
              </div>
            </>
          )}
          {billingCycle === 'YEARLY' && isPaid && originalPrice && originalPrice !== price && (
            <div className='flex items-center gap-2 mt-2'>
              <span className='inline-flex items-center bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-sm font-bold'>
                <svg width='16px' height='16px' className='mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                Save 20%
              </span>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className='flex-1 mb-8'>
          <ul className='space-y-3'>
            {Array.isArray(features) &&
              features.map((feature, index) => (
                <li key={index} className='flex items-start group'>
                  <div className='flex-shrink-0 w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-secondary-200 transition-colors'>
                    <svg
                      width='12px'
                      height='12px'
                      className='text-secondary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                  <span className='text-neutral-700 text-sm leading-relaxed'>{feature}</span>
                </li>
              ))}

            {/* Usage Limits */}
            {maxUsers && (
              <li className='flex items-start group'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-primary-200 transition-colors'>
                  <svg width='12px' height='12px' className='text-primary-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
                  </svg>
                </div>
                <span className='text-neutral-700 text-sm leading-relaxed'>
                  <strong className='font-semibold'>{maxUsers}</strong> {t('pricing.teamMembers')}
                </span>
              </li>
            )}

            {maxPatients && (
              <li className='flex items-start group'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-primary-200 transition-colors'>
                  <svg width='12px' height='12px' className='text-primary-700' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <span className='text-neutral-700 text-sm leading-relaxed'>
                  {t('pricing.upToPatients')}{' '}
                  <strong className='font-semibold'>{maxPatients.toLocaleString()}</strong>{' '}
                  {t('pricing.patients')}
                </span>
              </li>
            )}

            {maxStorageGB && (
              <li className='flex items-start group'>
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-status-warning/20 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-status-warning/30 transition-colors'>
                  <svg
                    width='12px'
                    height='12px'
                    className='text-status-warning'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <span className='text-neutral-700 text-sm leading-relaxed'>
                  <strong className='font-semibold'>{maxStorageGB}GB</strong> {t('pricing.storage')}
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
      </div>
    </div>
  );
}
