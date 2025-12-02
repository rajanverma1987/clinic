'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/Button';
import { SubscriptionCard } from '@/components/ui/SubscriptionCard';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  price: number; // in cents
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxUsers?: number;
  maxPatients?: number;
  maxStorageGB?: number;
  isPopular?: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/subscription-plans');
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push(`/register?planId=${planId}`);
      return;
    }

    // User is logged in, create subscription
    try {
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
          router.push('/subscription');
        }
      }
    } catch (error: any) {
      console.error('Failed to create subscription:', error);
      alert(error.message || 'Failed to create subscription');
    }
  };

  const filteredPlans = plans.filter(plan => plan.billingCycle === billingCycle);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading pricing plans...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the perfect plan for your clinic
            </p>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-8">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'YEARLY'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => (
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
                onSelect={() => handleSelectPlan(plan._id)}
                ctaText={user ? 'Subscribe Now' : 'Get Started'}
              />
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No plans available for {billingCycle.toLowerCase()} billing.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

