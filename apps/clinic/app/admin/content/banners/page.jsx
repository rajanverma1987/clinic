'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminContentBannersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Banner Management' subtitle='Homepage sliders, promotional banners, schedule'>
      <div className='admin-page-content'>
        <Card className='p-6'>
          <p className='text-neutral-600'>
            Banner management (homepage sliders, schedule) is planned.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
