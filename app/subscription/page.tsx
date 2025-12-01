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

interface Subscription {
  _id: string;
  status: string;
  paypalSubscriptionId?: string;
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
  };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSubscription();
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

  if (!subscription) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and payments</p>
        </div>

        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You don&apos;t have an active subscription</p>
            <Button onClick={() => router.push('/pricing')}>
              View Plans
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan</label>
              <p className="text-lg font-semibold text-gray-900">{subscription.planId.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(subscription.planId.price, subscription.planId.currency)}
                <span className="text-gray-600 text-sm ml-2">
                  /{subscription.planId.billingCycle === 'MONTHLY' ? 'month' : 'year'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Tag variant={getStatusColor(subscription.status)} className="mt-1">
                {subscription.status}
              </Tag>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Current Period</label>
              <p className="text-gray-900">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>

            {subscription.nextBillingDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Billing Date</label>
                <p className="text-gray-900">{formatDate(subscription.nextBillingDate)}</p>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  Your subscription will be cancelled at the end of the current billing period ({formatDate(subscription.currentPeriodEnd)}).
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant={subscription.cancelAtPeriodEnd ? 'primary' : 'outline'}
                onClick={handleCancel}
                isLoading={cancelling}
              >
                {subscription.cancelAtPeriodEnd ? 'Reactivate Subscription' : 'Cancel Subscription'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2">
            {subscription.planId.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Payment History</h2>
            <p className="text-sm text-gray-600">View all your subscription payment transactions</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/payment-history')}>
            View Payment History
          </Button>
        </div>
      </Card>
    </Layout>
  );
}

