'use client';

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useI18n } from '@/contexts/I18nContext.jsx';
import {
  ERROR_HANDLING,
  isManagerPathForbidden,
  pathRequiresTenant,
} from '@/lib/constants/route-security';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(ERROR_HANDLING.unauthorizedRedirect);
      return;
    }
    if (user.role === 'manager' && isManagerPathForbidden(pathname, user.managerAccess)) {
      router.push(ERROR_HANDLING.forbiddenRedirect);
      return;
    }
    if (pathRequiresTenant(pathname) && user.role !== 'super_admin' && !user.tenantId) {
      router.push(ERROR_HANDLING.forbiddenRedirect);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!user) {
    return null;
  }

  if (user.role === 'manager' && isManagerPathForbidden(pathname, user.managerAccess)) {
    return null;
  }
  if (pathRequiresTenant(pathname) && user.role !== 'super_admin' && !user.tenantId) {
    return null;
  }

  return <>{children}</>;
}
