'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminFinancialSettlementsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title='Doctor Settlements'
      subtitle='Pending settlements, mark as paid, reports'
      actionButton={
        <Button variant='primary' href='/admin/financial'>
          Back to Financial
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6'>
          <p className='text-neutral-600'>Settlements management is planned.</p>
        </Card>
      </div>
    </Layout>
  );
}
