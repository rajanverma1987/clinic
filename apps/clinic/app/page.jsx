'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Clinic app root. Marketing website is separate (website/ app at www).
 * Redirect to login so accounts.yoursite.com/ goes straight to sign-in.
 * Client-side redirect to keep app CSR.
 */
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}
