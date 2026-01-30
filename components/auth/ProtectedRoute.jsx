'use client';

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
