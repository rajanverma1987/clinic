'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/Button';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { useI18n } from '@/contexts/I18nContext';
import { CLINIC_APP_URL } from '@/lib/config';
import { CARD_FEATURES_BY_PLAN, YEARLY_SAVE } from '@/lib/constants/plan-features';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

/** Static plans for website – match clinic SOLO/CLINIC/ENTERPRISE. Price in cents. */
const STATIC_PLANS = [
  {
    name: 'SOLO',
    description: 'For solo practitioners',
    priceMonthly: 4900,
    priceYearly: null,
    currency: 'USD',
    isPopular: false,
    trialDays: 14,
  },
  {
    name: 'CLINIC',
    description: 'For growing practices',
    priceMonthly: 14900,
    priceYearly: null,
    currency: 'USD',
    isPopular: true,
    trialDays: 14,
  },
  {
    name: 'ENTERPRISE',
    description: 'Multi-location, custom needs',
    priceMonthly: 49900,
    priceYearly: null,
    currency: 'USD',
    isPopular: false,
    trialDays: 14,
  },
];

export default function PricingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const clinicUrl = useMemo(() => CLINIC_APP_URL.replace(/\/$/, ''), []);

  const displayedPlans = useMemo(() => {
    return STATIC_PLANS.map((plan) => {
      const monthlyCents = plan.priceMonthly;
      if (billingCycle === 'YEARLY') {
        const originalCents = monthlyCents * 12;
        const discountedCents = Math.round(monthlyCents * 12 * 0.95);
        return {
          ...plan,
          billingCycle: 'YEARLY',
          price: discountedCents,
          originalPrice: originalCents,
          features: CARD_FEATURES_BY_PLAN[plan.name] || [],
          yearlySaveAmount: YEARLY_SAVE[plan.name],
        };
      }
      return {
        ...plan,
        billingCycle: 'MONTHLY',
        price: monthlyCents,
        originalPrice: null,
        features: CARD_FEATURES_BY_PLAN[plan.name] || [],
        yearlySaveAmount: YEARLY_SAVE[plan.name],
      };
    });
  }, [billingCycle]);

  const handleSelectPlan = (plan) => {
    if (plan.name === 'ENTERPRISE') {
      router.push('/contact');
      return;
    }
    window.location.href = `${clinicUrl}/register?planId=${plan.name}`;
  };

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1'>
        {/* Hero Section – match clinic pricing hero */}
        <section
          className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden'
          style={{
            paddingTop: '80px',
            paddingBottom: '64px',
            paddingLeft: 'var(--space-8)',
            paddingRight: 'var(--space-8)',
          }}
        >
          <div
            className='absolute top-0 right-0 bg-primary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          />
          <div
            className='absolute bottom-0 left-0 bg-secondary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          />

          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='text-center'>
              <div
                className='inline-flex items-center bg-white border-2 border-neutral-200/80 text-primary-700 rounded-xl font-medium shadow-sm hover:shadow-md hover:border-primary-200 group'
                style={{
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  marginBottom: '32px',
                  gap: '10px',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0.01em',
                  fontWeight: '500',
                }}
              >
                <svg
                  className='icon icon-sm group-hover:scale-110'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Flexible Pricing Plans</span>
              </div>

              <h1
                className='text-neutral-900'
                style={{
                  fontSize: '32px',
                  lineHeight: '40px',
                  letterSpacing: '-0.02em',
                  fontWeight: '700',
                  marginBottom: '24px',
                }}
              >
                {t('pricing.title')}
              </h1>
              <p
                className='text-neutral-700 max-w-3xl mx-auto text-body-lg'
                style={{ marginBottom: '48px' }}
              >
                {t('pricing.description')}
              </p>

              <div
                className='inline-flex items-center bg-white border-2 border-neutral-200 rounded-xl shadow-md hover:shadow-lg'
                style={{ padding: '4px' }}
              >
                <Button
                  type='button'
                  onClick={() => setBillingCycle('MONTHLY')}
                  variant={billingCycle === 'MONTHLY' ? 'primary' : 'outline'}
                  size='md'
                  className={billingCycle === 'MONTHLY' ? '' : 'bg-white'}
                >
                  {t('pricing.monthly')}
                </Button>
                <Button
                  type='button'
                  onClick={() => setBillingCycle('YEARLY')}
                  variant={billingCycle === 'YEARLY' ? 'primary' : 'outline'}
                  size='md'
                  className={`relative ${billingCycle === 'YEARLY' ? '' : 'bg-white'}`}
                >
                  {t('pricing.yearly')}
                  <span
                    className='absolute -top-2 -right-2 bg-secondary-500 text-white font-bold rounded-full shadow-sm'
                    style={{
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      paddingTop: '2px',
                      paddingBottom: '2px',
                      fontSize: '10px',
                      lineHeight: '14px',
                    }}
                  >
                    {t('pricing.save20')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section
          className='bg-white'
          style={{
            paddingTop: '64px',
            paddingBottom: '64px',
            paddingLeft: 'var(--space-8)',
            paddingRight: 'var(--space-8)',
          }}
        >
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {displayedPlans.map((plan) => (
                <SubscriptionCard
                  key={plan.name}
                  name={plan.name}
                  description={plan.description}
                  price={plan.price}
                  originalPrice={plan.originalPrice}
                  currency={plan.currency}
                  billingCycle={plan.billingCycle}
                  features={plan.features}
                  isPopular={plan.isPopular}
                  yearlySaveAmount={plan.yearlySaveAmount}
                  trialDays={plan.trialDays}
                  onSelect={() => handleSelectPlan(plan)}
                  ctaText={
                    plan.name === 'ENTERPRISE' ? t('pricing.contactSales') : t('pricing.getStarted')
                  }
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
