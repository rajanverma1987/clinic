'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function SubscriptionReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const hasActivated = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (hasActivated.current) return;

    // PayPal redirects with token= or subscription_id= (subscription ID from PayPal)
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('token');

    if (!subscriptionId) {
      setStatus('error');
      setMessage(t('subscription.invalidSubscriptionId'));
      return;
    }

    hasActivated.current = true;

    const activateSubscription = async (sid) => {
      try {
        const response = await apiClient.post(`/subscriptions/${sid}?action=activate`, {});

        if (response.success) {
          setStatus('success');
          setMessage(t('subscription.subscriptionActivated'));

          setTimeout(() => {
            router.push('/subscription');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.error?.message || t('subscription.failedToActivateSubscription'));
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || t('subscription.failedToActivateSubscription'));
      }
    };

    activateSubscription(subscriptionId);
  }, [user, router, searchParams, t]);

  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='max-w-md w-full text-center'>
        {status === 'loading' && (
          <div className='py-12'>
            <Loader type='page' text={t('subscription.activatingSubscription')} />
          </div>
        )}

        {status === 'success' && (
          <div className='py-12'>
            <div className='w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-secondary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
              {t('subscription.success')}
            </h2>
            <p className='text-neutral-600 mb-6'>{message}</p>
            <p className='text-sm text-neutral-500'>{t('subscription.redirecting')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className='py-12'>
            <div className='w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-status-error'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-neutral-900 mb-2'>{t('subscription.error')}</h2>
            <p className='text-neutral-600 mb-6'>{message}</p>
            <Button href='/subscription'>{t('subscription.goToSubscription')}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SubscriptionReturnPage() {
  const { t } = useI18n();
  return (
    <Layout>
      <Suspense
        fallback={
          <div className='flex items-center justify-center min-h-[60vh]'>
            <Card className='max-w-md w-full text-center'>
              <div className='py-12'>
                <Loader type='page' text={t('common.loading')} />
              </div>
            </Card>
          </div>
        }
      >
        <SubscriptionReturnContent />
      </Suspense>
    </Layout>
  );
}
