'use client';

import { Layout } from '@/components/layout/Layout.jsx';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component that requires authentication
 * Redirects to login if user is not authenticated
 */
export function RequireAuth({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Loader size='md' text='Redirecting to login...' className='h-64' />
      </Layout>
    );
  }

  return <>{children}</>;
}
