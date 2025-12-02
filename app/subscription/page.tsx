'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';

interface Subscription {
  _id: string;
  status: string;
  paypalSubscriptionId?: string;
  paypalApprovalUrl?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  nextBillingDate?: string;
  planId: {
    _id: string;
    name: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: string[];
    maxUsers?: number;
    maxPatients?: number;
    maxStorageGB?: number;
  };
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  maxUsers?: number;
  maxPatients?: number;
  maxStorageGB?: number;
  isPopular?: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSubscription();
      fetchAvailablePlans();
    }
  }, [authLoading, user]);

  const fetchSubscription = async () => {
    try {
      const response = await apiClient.get<Subscription>('/subscriptions');
      if (response.success && response.data) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/subscription-plans');
      if (response.success && response.data) {
        setAvailablePlans(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    const plan = availablePlans.find(p => p._id === planId);
    if (!plan) return;

    if (!window.confirm(`Are you sure you want to ${subscription ? 'change' : 'subscribe'} to ${plan.name}?`)) {
      return;
    }

    setUpgrading(true);
    try {
      const isPaidPlan = plan.price > 0;
      const isFreePlan = plan.price === 0;

      // If switching to a PAID plan, always require PayPal payment
      if (isPaidPlan && subscription) {
        // For paid plans, create new subscription with PayPal (requires payment)
        const response = await apiClient.post<{ approvalUrl?: string }>('/subscriptions', {
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
        const response = await apiClient.post<{ approvalUrl?: string }>('/subscriptions', {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      alert(error.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    const colors: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
      ACTIVE: 'success',
      CANCELLED: 'danger',
      SUSPENDED: 'warning',
      EXPIRED: 'danger',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };


  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and payments</p>
      </div>

      {/* Current Subscription Section */}
      {subscription && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Plan</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Plan Card */}
            <div className="lg:col-span-1">
              <SubscriptionCard
                name={subscription.planId.name}
                price={subscription.planId.price}
                currency={subscription.planId.currency}
                billingCycle={subscription.planId.billingCycle as 'MONTHLY' | 'YEARLY'}
                features={subscription.planId.features}
                maxUsers={subscription.planId.maxUsers}
                maxPatients={subscription.planId.maxPatients}
                maxStorageGB={subscription.planId.maxStorageGB}
                isCurrent={true}
              />
            </div>

            {/* Subscription Details */}
            <Card className="lg:col-span-2">
              <h3 className="text-xl font-semibold mb-6">Subscription Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Tag variant={getStatusColor(subscription.status)} className="mt-1">
                      {subscription.status}
                    </Tag>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Period</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>

                {subscription.nextBillingDate && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Next Billing Date</p>
                      <p className="text-gray-900 font-medium mt-1">{formatDate(subscription.nextBillingDate)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(subscription.planId.price, subscription.planId.currency)}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Your subscription will be cancelled at the end of the current billing period ({formatDate(subscription.currentPeriodEnd)}).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    variant={subscription.cancelAtPeriodEnd ? 'primary' : 'outline'}
                    onClick={handleCancel}
                    isLoading={cancelling}
                  >
                    {subscription.cancelAtPeriodEnd ? 'Reactivate Subscription' : 'Cancel Subscription'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/payment-history')}
                  >
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
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {subscription ? 'Upgrade or Change Plan' : 'Choose a Plan'}
            </h2>
            <p className="text-gray-600 mt-2">
              {subscription 
                ? 'Select a different plan to upgrade or downgrade your subscription' 
                : 'Select a plan to get started with ClinicHub'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availablePlans
              .filter((plan) => {
                // Filter out Free Trial plan (shouldn't be in upgrade options)
                if (plan.name === 'Free Trial') return false;
                
                // Filter out current plan (already subscribed)
                if (subscription && subscription.planId._id === plan._id) return false;
                
                return true;
              })
              .map((plan) => (
                <SubscriptionCard
                  key={plan._id}
                  name={plan.name}
                  description={plan.description}
                  price={plan.price}
                  currency={plan.currency}
                  billingCycle={plan.billingCycle as 'MONTHLY' | 'YEARLY'}
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
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You don&apos;t have an active subscription</p>
            <Button onClick={() => router.push('/pricing')}>
              View Plans
            </Button>
          </div>
        </Card>
      )}
    </Layout>
  );
}

