'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminReviewsAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Rating Analytics' subtitle='Average rating, doctor/specialty-wise, trends' actionButton={<Button variant='primary' onClick={() => router.push('/admin/reviews')}>Back to Reviews</Button>}>
      <div style={{ padding: '0 10px' }}><Card className='p-6'><p className='text-neutral-600'>Rating analytics (platform avg, doctor/specialty-wise, trends, sentiment) — use Admin Dashboard for overall metrics.</p></Card></div>
    </Layout>
  );
}
