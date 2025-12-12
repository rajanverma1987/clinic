'use client';

import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';
import { Button } from '@/components/ui/Button';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PricingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [selectingPlanId, setSelectingPlanId] = useState(null);
  const [currentUserPlan, setCurrentUserPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscriptions/current');
      if (response.success && response.data) {
        setCurrentUserPlan(response.data.planId);
      }
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/subscription-plans');
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        setError('Failed to load subscription plans. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  const handleSelectPlan = async (planId, planName) => {
    // Set loading state for this specific plan
    setSelectingPlanId(planId);

    if (!user) {
      // Redirect to register with plan ID
      router.push(`/register?planId=${planId}`);
      return;
    }

    // User is logged in, create subscription
    try {
      const response = await apiClient.post('/subscriptions', {
        planId,
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`,
      });

      if (response.success && response.data) {
        if (response.data.approvalUrl) {
          // Redirect to PayPal approval
          window.location.href = response.data.approvalUrl;
        } else {
          // Subscription created successfully
          alert(`Successfully subscribed to ${planName}!`);
          router.push('/subscription');
        }
      } else {
        throw new Error(response.error?.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      alert(error.message || 'Failed to create subscription. Please try again.');
      setSelectingPlanId(null);
    }
  };

  const filteredPlans = plans.filter((plan) => plan.billingCycle === billingCycle);

  // Apply 20% discount to yearly plans
  const plansWithDiscount = filteredPlans.map((plan) => {
    if (plan.billingCycle === 'YEARLY') {
      return {
        ...plan,
        originalPrice: plan.price,
        price: Math.round(plan.price * 0.8), // 20% off
      };
    }
    return plan;
  });

  const displayedPlans = plansWithDiscount;

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col bg-white'>
        <Header />
        <main className='flex-1 flex items-center justify-center py-32'>
          <Loader size='lg' text={t('pricing.loadingPricingPlans') || 'Loading pricing plans...'} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex flex-col bg-white'>
        <Header />
        <main className='flex-1 flex items-center justify-center py-32'>
          <div className='text-center max-w-md'>
            <div className='bg-red-50 border-2 border-red-200 rounded-xl p-8 mb-4'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h2 className='text-2xl font-bold text-red-900 mb-2'>Unable to Load Pricing</h2>
              <p className='text-red-700 mb-6'>{error}</p>
              <Button variant='primary' onClick={() => { setLoading(true); fetchPlans(); }}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-neutral-50'>
      <Header />
      <main className='flex-1'>
        {/* Hero Section */}
        <section
          className='bg-gradient-to-br from-white via-neutral-50 to-primary-50/30 relative overflow-hidden'
          style={{
            paddingTop: '140px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          {/* Background accents */}
          <div
            className='absolute top-0 right-0 bg-primary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          ></div>
          <div
            className='absolute bottom-0 left-0 bg-secondary-100 rounded-full mix-blend-multiply filter opacity-30'
            style={{ width: '400px', height: '400px', filter: 'blur(100px)' }}
          ></div>

          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='text-center'>
              {/* Premium badge */}
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
                  style={{ width: '18px', height: '18px' }}
                  className='group-hover:scale-110'
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
                className='text-neutral-700 max-w-3xl mx-auto'
                style={{
                  fontSize: '18px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  fontWeight: '400',
                  marginBottom: '48px',
                }}
              >
                {t('pricing.description')}
              </p>

              {/* Billing Cycle Toggle */}
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

        {/* Pricing Cards Section */}
        <section
          className='bg-white'
          style={{
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <div className='max-w-7xl mx-auto'>
            {filteredPlans.length > 0 ? (
              <>
                <div
                  className='grid grid-cols-4'
                  style={{ gap: '24px' }}
                >
                  {displayedPlans.map((plan) => (
                  <SubscriptionCard
                    key={plan._id}
                    name={plan.name}
                    description={plan.description}
                    price={plan.price}
                    originalPrice={plan.originalPrice}
                    currency={plan.currency}
                    billingCycle={plan.billingCycle}
                    features={plan.features}
                    maxUsers={plan.maxUsers}
                    maxPatients={plan.maxPatients}
                    maxStorageGB={plan.maxStorageGB}
                    isPopular={plan.isPopular}
                    onSelect={() => handleSelectPlan(plan._id)}
                    ctaText={user ? t('pricing.subscribeNow') : t('pricing.getStarted')}
                  />
                ))}
              </div>

            </>
            ) : (
              <div className='text-center' style={{ paddingTop: '48px', paddingBottom: '48px' }}>
                <div
                  className='bg-white border-2 border-neutral-200 rounded-2xl shadow-lg hover:shadow-xl max-w-2xl mx-auto'
                  style={{ padding: '48px' }}
                >
                  <div
                    className='bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm'
                    style={{ width: '80px', height: '80px', marginBottom: '24px' }}
                  >
                    <svg
                      className='text-primary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      style={{ width: '40px', height: '40px' }}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                  </div>
                  <h3
                    className='text-neutral-900'
                    style={{
                      fontSize: '28px',
                      lineHeight: '36px',
                      letterSpacing: '-0.01em',
                      fontWeight: '700',
                      marginBottom: '12px',
                    }}
                  >
                    {t('pricing.noPlansAvailable', { billingCycle: billingCycle.toLowerCase() })}
                  </h3>
                  <p className='text-neutral-600 text-body-md' style={{ marginBottom: '32px' }}>
                    Please check back later or contact us for more information.
                  </p>
                  <Button
                    variant='primary'
                    size='md'
                    className='whitespace-nowrap'
                    onClick={() => router.push('/support/contact')}
                  >
                    Contact Us
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
