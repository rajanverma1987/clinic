'use client';

/**
 * Patient Portal is disabled when the app is configured as clinic/doctor-only.
 * All /patient-portal routes are redirected by middleware to /login?reason=clinic_only.
 * This layout is a fallback: if middleware didn't run (e.g. edge cases), we redirect here.
 */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PatientPortalLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?reason=clinic_only');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="text-center max-w-md">
        <p className="text-neutral-600 mb-4">
          This application is for clinic staff and doctors only. Patients receive video call links from their clinic when needed.
        </p>
        <p className="text-sm text-neutral-500">Redirecting to sign in…</p>
      </div>
    </div>
  );
}
