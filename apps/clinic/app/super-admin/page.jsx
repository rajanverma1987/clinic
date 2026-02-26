'use client';

/**
 * Super_Admin.md: Base path /super-admin — redirect to admin overview.
 * Keeps spec URL structure valid; actual UI lives under /admin.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuperAdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
