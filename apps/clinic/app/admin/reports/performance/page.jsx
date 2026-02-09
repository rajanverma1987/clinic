'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReportsPerformancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Performance Reports' subtitle='Doctor ratings, satisfaction, wait time'>
      <div className='admin-page-content'>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            Performance reports — use Admin Reviews and Dashboard for ratings and metrics.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
