'use client';

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component that requires authentication
 * Redirects to login if user is not authenticated
 */
export function RequireAuth({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!user) {
    return <Loader type='page' text={t('auth.redirectingToLogin')} />;
  }

  return <>{children}</>;
}
