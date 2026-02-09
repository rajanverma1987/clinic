'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReviewsDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title='Reviews Dashboard'
      subtitle='All reviews, filter by rating/date/doctor'
      actionButton={
        <Button variant='primary' href='/admin/reviews'>
          Back to Reviews
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            Reviews list (filter by rating, date, doctor, flagged) — use Doctor Reviews and Reports
            for data.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
