'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects /inventory/lots to /inventory?tab=lots for unified tabbed UX.
 * Keeps old links and bookmarks working.
 */
export default function LotsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'lots');
    router.replace(`/inventory?${params.toString()}`, { scroll: false });
  }, [authLoading, user, router, searchParams]);

  return null;
}
