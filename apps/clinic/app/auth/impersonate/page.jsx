'use client';

import { apiClient } from '@/lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ImpersonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-600">Logging in as clinic...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">
          {error === 'missing_token' && 'Invalid link: missing token'}
          {error === 'invalid_or_expired' && 'Link expired or invalid'}
          {error === 'no_user' && 'No admin user found for this clinic'}
          {error === 'network_error' && 'Network error. Please try again.'}
          {!['missing_token', 'invalid_or_expired', 'no_user', 'network_error'].includes(error) &&
            'Unable to log in'}
        </p>
        <a href="/admin/clients" className="text-primary-600 hover:underline">
          Back to Clients
        </a>
      </div>
    );
  }

  return null;
}
