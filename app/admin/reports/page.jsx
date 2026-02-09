'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  {
    href: '/admin/reports/user',
    label: 'User Reports',
    desc: 'Registrations, active users, retention, demographics',
  },
  {
    href: '/admin/reports/appointments',
    label: 'Appointment Reports',
    desc: 'Booking trends, cancellation, utilization, time slots',
  },
  {
    href: '/admin/reports/financial',
    label: 'Financial Reports',
    desc: 'Revenue, refunds, tax, P&L',
  },
  {
    href: '/admin/reports/performance',
    label: 'Performance Reports',
    desc: 'Doctor ratings, satisfaction, wait time, duration',
  },
  {
    href: '/admin/reports/export',
    label: 'Export Options',
    desc: 'PDF, Excel, CSV, date range, custom builder',
  },
];

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout
      title='Reports & Analytics'
      subtitle='User, appointment, financial, performance reports'
      actionButton={
        <Button variant='primary' href='/admin'>
          Back to Dashboard
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, label, desc }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{label}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{desc}</p>
            <Button variant='secondary' href={href}>
              Open
            </Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
