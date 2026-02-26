'use client';

/**
 * Super_Admin.md: All super-admin routes must be wrapped in SuperAdminGuard.
 * Verifies role = SUPER_ADMIN on every render; on mismatch redirects to /unauthorized.
 */

import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SUPER_ADMIN_UNAUTHORIZED_REDIRECT = '/unauthorized';

export function SuperAdminGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'super_admin') {
      router.push(SUPER_ADMIN_UNAUTHORIZED_REDIRECT);
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <Loader fullScreen size='lg' />;
  }

  if (!user || user.role !== 'super_admin') {
    return <Loader fullScreen size='lg' />;
  }

  return <>{children}</>;
}
