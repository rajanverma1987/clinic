'use client';

import { useFeatures } from '@/contexts/FeatureContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from './Loader';

export function FeatureGuard({ feature, children, fallback, redirectTo }) {
  const { hasFeature, loading } = useFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasFeature(feature) && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasFeature, feature, loading, redirectTo, router]);

  if (loading) {
    return <Loader size='md' className='h-64' />;
  }

  if (!hasFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Feature Not Available</h2>
          <p className='text-gray-600 mb-4'>
            This feature ({feature}) is not included in your subscription plan.
          </p>
          <a href='/subscription' className='text-blue-600 hover:text-blue-800 underline'>
            Upgrade your plan to access this feature
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
