'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSettingsGeneralPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='General Settings' subtitle='Platform name, logo, contact, social' actionButton={<Button variant='primary' onClick={() => router.push('/admin/settings')}>Back to Settings</Button>}>
      <div style={{ padding: '0 10px' }}><Card className='p-6'><p className='text-neutral-600'>General settings (platform name, logo, contact, social, support) — configure via Tenant or app config.</p></Card></div>
    </Layout>
  );
}
