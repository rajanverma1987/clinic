'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Public clinic signup is not in scope. Clinics are provisioned by admin/sales.
 * Redirect to login. Future: replace with /invite/accept/[token] for staff-only invites.
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
