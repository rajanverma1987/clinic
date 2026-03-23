'use client';

import { ADMIN_FINANCIAL_CHILDREN } from '@/lib/constants/dashboard-structure';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Redirect /admin/financial to first tab (revenue). Layout renders tab bar + children. */
export default function AdminFinancialPage() {
  const router = useRouter();
  useEffect(() => {
    const firstPath = ADMIN_FINANCIAL_CHILDREN[0]?.path;
    if (firstPath) router.replace(firstPath);
  }, [router]);
  return null;
}
