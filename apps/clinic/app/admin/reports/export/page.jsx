'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReportsExportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Export Options' subtitle='PDF, Excel, CSV, date range, custom builder'>
      <div className='admin-page-content'>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            Export (PDF, Excel, CSV, date range) is planned. Patient/doctor exports are available
            from their list pages.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
