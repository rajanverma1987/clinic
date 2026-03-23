'use client';

import { ADMIN_CONTENT_CHILDREN } from '@/lib/constants/dashboard-structure';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Redirect /admin/content to first tab (specialties). Layout renders tab bar + children. */
export default function AdminContentPage() {
  const router = useRouter();
  useEffect(() => {
    const firstPath = ADMIN_CONTENT_CHILDREN[0]?.path;
    if (firstPath) router.replace(firstPath);
  }, [router]);
  return null;
}
