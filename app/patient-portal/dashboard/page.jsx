'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';

/**
 * Patient portal dashboard – clinic-only mode.
 * Redirects to login; patient portal is disabled.
 */
export default function PatientDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?reason=clinic_only');
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-neutral-50'>
      <Loader size='lg' />
    </div>
  );
}
