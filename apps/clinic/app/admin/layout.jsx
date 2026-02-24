'use client';

/**
 * Admin layout – wraps all /admin/* pages.
 * Shows full-screen loader during auth loading (covers sidebar and header).
 * Redirects non-super_admin users to dashboard.
 */

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Show full-screen loader during auth loading (covers entire viewport including sidebar/header)
  if (authLoading) {
    return <Loader fullScreen size='lg' />;
  }

  // Don't render anything while redirecting non-super_admin users
  if (!user || user.role !== 'super_admin') {
    return <Loader fullScreen size='lg' />;
  }

  return children;
}
