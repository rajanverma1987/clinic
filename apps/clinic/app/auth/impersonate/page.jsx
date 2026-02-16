'use client';

import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ImpersonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('missing_token');
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const response = await fetch(`/api/auth/impersonate?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.data) {
          setError(data.error || 'invalid_or_expired');
          setStatus('error');
          return;
        }

        const { accessToken, refreshToken, user } = data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }
        apiClient.setToken(accessToken);
        setStatus('success');
        router.replace('/dashboard');
      } catch (err) {
        setError('network_error');
        setStatus('error');
      }
    })();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-neutral-600'>{t('auth.impersonateLoggingIn')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4'>
        <p className='text-red-600'>
          {error === 'missing_token' && t('auth.impersonateInvalidLink')}
          {error === 'invalid_or_expired' && t('auth.impersonateLinkExpired')}
          {error === 'no_user' && t('auth.impersonateNoUser')}
          {error === 'network_error' && t('auth.impersonateNetworkError')}
          {!['missing_token', 'invalid_or_expired', 'no_user', 'network_error'].includes(error) &&
            t('auth.impersonateUnableToLogIn')}
        </p>
        <a href='/admin/clients' className='text-primary-600 hover:underline'>
          {t('common.backToClients')}
        </a>
      </div>
    );
  }

  return null;
}
