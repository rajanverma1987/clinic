'use client';

/**
 * Super_Admin.md: On role mismatch for super-admin routes, redirect here.
 * Shown when a non–super-admin user attempts to access /admin/*.
 */

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UnauthorizedPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await apiClient.post('/auth/logout', undefined, {}, true);
    } catch (_) {}
    apiClient.setToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    }
    setSigningOut(false);
    router.push('/login');
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4'>
      <div className='max-w-md w-full text-center'>
        <h1 className='text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2'>
          {t('errors.unauthorizedTitle') || 'Access denied'}
        </h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-6'>
          {t('errors.unauthorizedMessage') ||
            "You don't have permission to access this resource. Please contact your administrator."}
        </p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button variant='primary' onClick={() => router.push('/dashboard')}>
            {t('errors.goHome') || 'Go to dashboard'}
          </Button>
          <Button
            variant='secondary'
            onClick={handleSignOut}
            disabled={signingOut}
            isLoading={signingOut}
          >
            {t('common.signOut') || 'Sign out'}
          </Button>
        </div>
      </div>
    </div>
  );
}
