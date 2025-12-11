/**
 * Premium Feature Guard Component
 *
 * Wraps content that requires premium access and shows upgrade prompt if needed
 */

'use client';

import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Button } from './Button';
import { Card } from './Card';
import { useRouter } from 'next/navigation';

export function PremiumFeatureGuard({
  feature,
  children,
  fallback = null,
  showUpgradePrompt = true,
  className = '',
}) {
  const { hasAccess, getFeatureInfo, getUpgradeMessage } = usePremiumFeatures();
  const router = useRouter();

  // Check if user has access to the feature
  const hasFeatureAccess = hasAccess(feature);

  // If user has access, render children
  if (hasFeatureAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback !== null) {
    return fallback;
  }

  // If showUpgradePrompt is false, return null
  if (!showUpgradePrompt) {
    return null;
  }

  // Get feature information
  const featureInfo = getFeatureInfo(feature);
  const upgradeMessage = getUpgradeMessage(feature);

  // Show upgrade prompt
  return (
    <div className={className}>
      <Card className='border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white'>
        <div className='p-8 text-center'>
          {/* Icon */}
          <div className='w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm'>
            <span className='text-3xl'>{featureInfo.icon}</span>
          </div>

          {/* Title */}
          <h3 className='text-2xl font-bold text-neutral-900 mb-2'>{featureInfo.name}</h3>

          {/* Description */}
          <p className='text-neutral-600 mb-4'>{featureInfo.description}</p>

          {/* Upgrade Message */}
          <div className='bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6'>
            <div className='flex items-start gap-3'>
              <svg
                className='w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-sm text-primary-800 text-left font-medium'>{upgradeMessage}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              variant='primary'
              size='md'
              onClick={() => router.push('/pricing')}
              className='whitespace-nowrap'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
              Upgrade Now
            </Button>
            <Button
              variant='secondary'
              size='md'
              onClick={() => router.push('/support/contact')}
              className='whitespace-nowrap'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
              Contact Sales
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PremiumFeatureGuard;
