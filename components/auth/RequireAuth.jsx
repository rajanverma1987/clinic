'use client';

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
    return <Loader fullScreen size='lg' />;
  }

  if (!user) {
    return <Loader fullScreen size='lg' text='Redirecting to login...' />;
  }

  return <>{children}</>;
}
