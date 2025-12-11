'use client';

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
