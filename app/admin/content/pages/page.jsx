'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminContentPagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Static Pages' subtitle='Edit About, Contact, Terms, Privacy, footer links' actionButton={<Button variant='primary' onClick={() => router.push('/admin/content')}>Back to Content</Button>}>
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6'><p className='text-neutral-600'>Static pages editor (About, Contact, Terms, Privacy, content blocks) is planned.</p></Card>
      </div>
    </Layout>
  );
}
