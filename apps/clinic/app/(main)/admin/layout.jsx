'use client';

/**
 * Admin layout – wraps all /admin/* pages.
 * Super_Admin.md: all routes wrapped in SuperAdminGuard; redirect to /unauthorized on role mismatch.
 * Routes removed per Super_Admin.md (not in scope): doctor verifications, reviews, content.
 */

import { SuperAdminGuard } from '@/components/auth/SuperAdminGuard';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Super_Admin.md: these are marketplace features – not in scope. Redirect to Overview. */
const SUPER_ADMIN_FORBIDDEN_PATHS = ['/admin/doctors/verify', '/admin/content', '/admin/reviews'];

function isForbiddenPath(pathname) {
  const p = (pathname || '').replace(/\/$/, '') || '';
  return SUPER_ADMIN_FORBIDDEN_PATHS.some(
    (forbidden) => p === forbidden || p.startsWith(forbidden + '/'),
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user?.role === 'super_admin' && isForbiddenPath(pathname)) {
      router.replace('/admin');
    }
  }, [authLoading, user, router, pathname]);

  return (
    <SuperAdminGuard>
      {isForbiddenPath(pathname) ? (
        <Loader fullScreen size='lg' />
      ) : (
        children
      )}
    </SuperAdminGuard>
  );
}
