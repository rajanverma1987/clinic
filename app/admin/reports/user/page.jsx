'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReportsUserPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title='User Reports'
      subtitle='Registrations, active users, retention, demographics'
      actionButton={
        <Button variant='primary' href='/admin/reports'>
          Back to Reports
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            User reports (daily/weekly/monthly registrations, active users, retention, demographics)
            — use Admin Dashboard and Users for current data.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
