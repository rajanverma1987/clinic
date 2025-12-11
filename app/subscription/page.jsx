'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSubscription();
      fetchAvailablePlans();
    } else if (!authLoading && !user) {
      // User not logged in, redirect to login
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const fetchSubscription = async () => {
    try {
      const response = await apiClient.get('/subscriptions');
      if (response.success && response.data) {
        // Ensure planId is populated and is an object, not just an ObjectId
        if (response.data.planId && typeof response.data.planId === 'object') {
          setSubscription(response.data);
        } else {
          // Plan not populated, set subscription without plan data
          console.warn('Subscription plan not populated');
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await apiClient.get('/subscription-plans');
      if (response.success && response.data) {
        setAvailablePlans(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!user) return;

    const plan = availablePlans.find((p) => p._id === planId);
    if (!plan) return;

    if (
      !window.confirm(
        `Are you sure you want to ${subscription ? 'change' : 'subscribe'} to ${plan.name}?`
      )
    ) {
      return;
    }

    setUpgrading(true);
    try {
      const isPaidPlan = plan.price > 0;
      const isFreePlan = plan.price === 0;

      // If switching to a PAID plan, always require PayPal payment
      if (isPaidPlan && subscription) {
        // For paid plans, create new subscription with PayPal (requires payment)
        const response = await apiClient.post('/subscriptions', {
          planId,
          customerEmail: user.email,
          customerName: `${user.firstName} ${user.lastName}`,
        });

        if (response.success && response.data) {
          if (response.data.approvalUrl) {
            // Redirect to PayPal approval for payment
            alert('You will be redirected to PayPal to complete your payment.');
            window.location.href = response.data.approvalUrl;
          } else {
            alert('Subscription updated successfully!');
            fetchSubscription();
          }
        }
      } else if (isFreePlan && subscription) {
        // For FREE plans, can update directly without PayPal
        const response = await apiClient.put(`/subscriptions/${subscription._id}?action=upgrade`, {
          planId,
        });

        if (response.success) {
          alert('Subscription updated successfully!');
          fetchSubscription();
        }
      } else if (!subscription) {
        // No existing subscription, create new one
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
            alert('Subscription updated successfully!');
            fetchSubscription();
          }
        }
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert(error.message || 'Failed to update subscription');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    const confirmMessage = subscription.cancelAtPeriodEnd
      ? 'Subscription is already set to cancel. Do you want to reactivate it?'
      : 'Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCancelling(true);
    try {
      const response = await apiClient.post(`/subscriptions/${subscription._id}?action=cancel`, {
        cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd,
      });

      if (response.success) {
        fetchSubscription();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert(error.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      CANCELLED: 'danger',
      SUSPENDED: 'warning',
      EXPIRED: 'danger',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };

  // Redirect handled in useEffect above
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  return (
    <Layout>
      <DashboardHeader title='Subscription' subtitle='Manage your subscription and payments' />

      {/* Current Subscription Section */}
      {subscription && subscription.planId && typeof subscription.planId === 'object' && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-neutral-900 mb-6'>Current Plan</h2>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Current Plan Card */}
            <div className='lg:col-span-1'>
              <SubscriptionCard
                name={subscription.planId?.name || 'Unknown Plan'}
                price={subscription.planId?.price || 0}
                currency={subscription.planId?.currency || 'USD'}
                billingCycle={subscription.planId?.billingCycle || 'MONTHLY'}
                features={subscription.planId?.features || []}
                maxUsers={subscription.planId?.maxUsers}
                maxPatients={subscription.planId?.maxPatients}
                maxStorageGB={subscription.planId?.maxStorageGB}
                isCurrent={true}
              />
            </div>

            {/* Subscription Details */}
            <Card className='lg:col-span-2'>
              <h3 className='text-xl font-semibold mb-6'>Subscription Details</h3>

              <div className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b border-neutral-200'>
                  <div>
                    <p className='text-sm font-medium text-neutral-500'>Status</p>
                    <Tag variant={getStatusColor(subscription.status)} className='mt-1'>
                      {subscription.status}
                    </Tag>
                  </div>
                </div>

                {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                  <div className='flex items-center justify-between py-3 border-b border-neutral-200'>
                    <div>
                      <p className='text-sm font-medium text-neutral-500'>Current Period</p>
                      <p className='text-neutral-900 font-medium mt-1'>
                        {formatDate(subscription.currentPeriodStart)} -{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                )}

                {subscription.nextBillingDate && (
                  <div className='flex items-center justify-between py-3 border-b border-neutral-200'>
                    <div>
                      <p className='text-sm font-medium text-neutral-500'>Next Billing Date</p>
                      <p className='text-neutral-900 font-medium mt-1'>
                        {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                  </div>
                )}

                {subscription.planId && (
                  <div className='flex items-center justify-between py-3 border-b border-neutral-200'>
                    <div>
                      <p className='text-sm font-medium text-neutral-500'>Monthly Cost</p>
                      <p className='text-2xl font-bold text-neutral-900 mt-1'>
                        {formatCurrency(
                          subscription.planId?.price || 0,
                          subscription.planId?.currency || 'USD'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <div className='bg-status-warning/10 border-l-4 border-status-warning p-4 rounded'>
                    <div className='flex'>
                      <div className='flex-shrink-0'>
                        <svg
                          className='h-5 w-5 text-status-warning'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm text-status-warning'>
                          Your subscription will be cancelled at the end of the current billing
                          period ({formatDate(subscription.currentPeriodEnd)}).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className='pt-4 flex gap-3'>
                  <Button
                    variant={subscription.cancelAtPeriodEnd ? 'primary' : 'secondary'}
                    onClick={handleCancel}
                    isLoading={cancelling}
                  >
                    {subscription.cancelAtPeriodEnd
                      ? 'Reactivate Subscription'
                      : 'Cancel Subscription'}
                  </Button>
                  <Button variant='secondary' onClick={() => router.push('/payment-history')}>
                    View Payment History
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Upgrade/Change Plan Section */}
      {availablePlans.length > 0 && (
        <div className='mb-12'>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-neutral-900'>
              {subscription ? 'Upgrade or Change Plan' : 'Choose a Plan'}
            </h2>
            <p className='text-neutral-600 mt-2'>
              {subscription
                ? 'Select a different plan to upgrade or downgrade your subscription'
                : "Select a plan to get started with Doctor's Clinic"}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {availablePlans
              .filter((plan) => {
                // Filter out Free Trial plan (shouldn't be in upgrade options)
                if (plan.name === 'Free Trial') return false;

                // Filter out current plan (already subscribed)
                if (
                  subscription &&
                  subscription.planId &&
                  typeof subscription.planId === 'object' &&
                  subscription.planId._id === plan._id
                )
                  return false;

                return true;
              })
              .map((plan) => (
                <SubscriptionCard
                  key={plan._id}
                  name={plan.name}
                  description={plan.description}
                  price={plan.price}
                  currency={plan.currency}
                  billingCycle={plan.billingCycle}
                  features={plan.features}
                  maxUsers={plan.maxUsers}
                  maxPatients={plan.maxPatients}
                  maxStorageGB={plan.maxStorageGB}
                  isPopular={plan.isPopular}
                  onSelect={() => handleUpgrade(plan._id)}
                  ctaText={subscription ? 'Switch to this Plan' : 'Get Started'}
                  ctaDisabled={upgrading}
                />
              ))}
          </div>
        </div>
      )}

      {/* No Subscription Message */}
      {!subscription && availablePlans.length === 0 && (
        <Card>
          <div className='text-center py-12'>
            <p className='text-neutral-600 mb-4'>You don&apos;t have an active subscription</p>
            <Button onClick={() => router.push('/pricing')}>View Plans</Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}
