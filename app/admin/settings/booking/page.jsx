'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSettingsBookingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title='Booking Settings'
      subtitle='Advance booking, cancellation, no-show, buffer'
      actionButton={
        <Button variant='primary' href='/admin/settings'>
          Back to Settings
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            Booking settings (min/max advance, cancellation/reschedule/no-show policy, buffer time)
            are planned.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
