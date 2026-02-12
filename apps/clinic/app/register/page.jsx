'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Register entry: Get Started on website points to clinic app /register.
 * Show the same registration flow as try-for-free (clinic + admin account).
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/try-for-free');
  }, [router]);
  return null;
}
