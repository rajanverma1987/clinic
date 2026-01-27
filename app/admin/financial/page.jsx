'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  { href: '/admin/financial/revenue', label: 'Revenue Dashboard', desc: 'Total revenue, commission, pending settlements, by doctor/specialty' },
  { href: '/admin/financial/settlements', label: 'Doctor Settlements', desc: 'Pending settlements, mark as paid, reports, disputes' },
  { href: '/admin/financial/commission', label: 'Commission Settings', desc: 'Platform commission %, doctor/specialty rates, payment cycle' },
  { href: '/admin/financial/invoicing', label: 'Invoicing', desc: 'Generate invoices, tax, templates, email' },
];

export default function AdminFinancialPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Financial Management' subtitle='Revenue, settlements, commission, invoicing' actionButton={<Button variant='primary' onClick={() => router.push('/admin')}>Back to Dashboard</Button>}>
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, label, desc }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{label}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{desc}</p>
            <Button variant='secondary' onClick={() => router.push(href)}>Open</Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
