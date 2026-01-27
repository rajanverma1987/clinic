'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSettingsSecurityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Security Settings' subtitle='Password policies, 2FA, IP whitelist, rate limiting' actionButton={<Button variant='primary' onClick={() => router.push('/admin/settings')}>Back to Settings</Button>}>
      <div style={{ padding: '0 10px' }}><Card className='p-6'><p className='text-neutral-600'>Security (password policies, session timeout, 2FA, IP whitelist) — use Admin IP Whitelist and auth flows.</p></Card></div>
    </Layout>
  );
}
