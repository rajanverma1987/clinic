'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SubscriptionCancelFallback() {
  const { t } = useI18n();
  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='max-w-md w-full text-center'>
        <div className='py-12'>
          <Loader type='page' text={t('common.loading')} />
        </div>
      </Card>
    </div>
  );
}

function SubscriptionCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [subscriptionId, setSubscriptionId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extract PayPal parameters from URL
    const subId = searchParams.get('subscription_id');
    const baToken = searchParams.get('ba_token');
    const paypalToken = searchParams.get('token');

    if (subId) setSubscriptionId(subId);
    if (paypalToken) setToken(paypalToken);

    // Log cancellation for debugging
    logger.debug('PayPal payment cancelled:', {
      subscription_id: subId,
      ba_token: baToken,
      token: paypalToken,
    });
  }, [searchParams]);

  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='max-w-2xl w-full'>
        <div className='p-8 text-center'>
          {/* Cancelled Icon */}
          <div className='w-20 h-20 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg
              className='w-10 h-10 text-status-warning'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className='text-3xl font-bold text-neutral-900 mb-3'>{t('subscription.paymentCancelled')}</h1>

          {/* Description */}
          <p className='text-neutral-600 mb-2 text-lg'>{t('subscription.subscriptionPaymentCancelled')}</p>
          <p className='text-neutral-500 mb-8'>{t('subscription.noChargesMade')}</p>

          {/* Details */}
          {subscriptionId && (
            <div className='bg-neutral-100 rounded-lg p-4 mb-8'>
              <div className='text-sm text-neutral-600 space-y-1'>
                <p>
                  <strong>{t('subscription.paypalSubscriptionId')}:</strong>{' '}
                  <span className='font-mono text-neutral-800 text-xs'>{subscriptionId}</span>
                </p>
                {token && (
                  <p>
                    <strong>{t('subscription.token')}:</strong>{' '}
                    <span className='font-mono text-neutral-800 text-xs'>{token}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* What Happened */}
          <div className='bg-primary-100 border-l-4 border-primary-400 p-4 mb-8 text-left'>
            <h3 className='text-sm font-semibold text-primary-900 mb-2'>{t('subscription.whatHappened')}</h3>
            <ul className='text-sm text-primary-700 space-y-2'>
              <li className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{t('subscription.cancelledOnPaypal')}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{t('subscription.subscriptionNotActivated')}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{t('subscription.noPaymentProcessed')}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{t('subscription.trySubscribingAgain')}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-6'>
            <Button onClick={() => router.push('/subscription')} className='flex-1 sm:flex-none'>
              {t('subscription.tryAgain')}
            </Button>
            <Button
              variant='secondary'
              onClick={() => router.push('/pricing')}
              className='flex-1 sm:flex-none'
            >
              {t('subscription.viewAllPlans')}
            </Button>
            <Button
              variant='secondary'
              onClick={() => router.push('/dashboard')}
              className='flex-1 sm:flex-none'
            >
              {t('subscription.goToDashboard')}
            </Button>
          </div>

          {/* Support Section */}
          <div className='pt-6 border-t border-neutral-200'>
            <p className='text-sm text-neutral-600 mb-3'>
              {t('subscription.needHelp')}
            </p>
            <Button variant='secondary' size='sm' onClick={() => router.push('/support/contact')}>
              {t('subscription.contactSupport')}
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
      <Suspense fallback={<SubscriptionCancelFallback />}>
        <SubscriptionCancelContent />
      </Suspense>
    </Layout>
  );
}
