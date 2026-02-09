'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReportsFinancialPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Financial Reports' subtitle='Revenue, refunds, tax, P&L'>
      <div className='admin-page-content'>
        <Card className='p-6'>
          <p className='text-neutral-600'>Financial reports are planned.</p>
        </Card>
      </div>
    </Layout>
  );
}
