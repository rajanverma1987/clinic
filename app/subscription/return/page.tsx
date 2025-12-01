'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SubscriptionReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const subscriptionId = searchParams.get('subscription_id');
    const token = searchParams.get('token');

    if (!subscriptionId) {
      setStatus('error');
      setMessage('Invalid subscription ID');
      return;
    }

    // Activate subscription
    activateSubscription(subscriptionId);
  }, [user]);

  const activateSubscription = async (subscriptionId: string) => {
    try {
      const response = await apiClient.post(`/subscriptions/${subscriptionId}?action=activate`, {});
      
      if (response.success) {
        setStatus('success');
        setMessage('Subscription activated successfully!');
        
        // Redirect to subscription page after 2 seconds
        setTimeout(() => {
          router.push('/subscription');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(response.error?.message || 'Failed to activate subscription');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to activate subscription');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          {status === 'loading' && (
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Activating your subscription...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to your subscription page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={() => router.push('/subscription')}>
                Go to Subscription
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

