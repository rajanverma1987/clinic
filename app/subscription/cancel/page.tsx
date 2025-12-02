'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function SubscriptionCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionId, setSubscriptionId] = useState<string>('');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Extract PayPal parameters from URL
    const subId = searchParams.get('subscription_id');
    const baToken = searchParams.get('ba_token');
    const paypalToken = searchParams.get('token');

    if (subId) setSubscriptionId(subId);
    if (paypalToken) setToken(paypalToken);

    // Log cancellation for debugging
    console.log('PayPal payment cancelled:', {
      subscription_id: subId,
      ba_token: baToken,
      token: paypalToken,
    });
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full">
        <div className="p-8 text-center">
          {/* Cancelled Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Cancelled
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-2 text-lg">
            Your subscription payment was cancelled.
          </p>
          <p className="text-gray-500 mb-8">
            No charges have been made to your account.
          </p>

          {/* Details */}
          {subscriptionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>PayPal Subscription ID:</strong>{' '}
                  <span className="font-mono text-gray-800 text-xs">{subscriptionId}</span>
                </p>
                {token && (
                  <p>
                    <strong>Token:</strong>{' '}
                    <span className="font-mono text-gray-800 text-xs">{token}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* What Happened */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              What happened?
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You cancelled the payment process on PayPal</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Your subscription was not activated</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>No payment was processed</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You can try subscribing again anytime</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              onClick={() => router.push('/subscription')}
              className="flex-1 sm:flex-none"
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/pricing')}
              className="flex-1 sm:flex-none"
            >
              View All Plans
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="flex-1 sm:flex-none"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Support Section */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Need help or have questions about our plans?
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/support/contact')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SubscriptionCancelPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center">
            <div className="py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </Card>
        </div>
      }>
        <SubscriptionCancelContent />
      </Suspense>
    </Layout>
  );
}
