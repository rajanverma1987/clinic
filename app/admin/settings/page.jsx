'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  { href: '/admin/settings/general', label: 'General Settings', desc: 'Platform name, logo, contact, social, operating hours' },
  { href: '/admin/settings/booking', label: 'Booking Settings', desc: 'Advance booking, cancellation, reschedule, no-show, buffer time' },
  { href: '/admin/settings/payment', label: 'Payment Settings', desc: 'Gateways, methods, refund policy, fees, currency' },
  { href: '/admin/settings/notification', label: 'Notification Settings', desc: 'Email/SMS templates, push, triggers' },
  { href: '/admin/settings/email-sms', label: 'Email/SMS Configuration', desc: 'SMTP, SMS gateway, sender ID, templates' },
  { href: '/admin/settings/seo', label: 'SEO Settings', desc: 'Meta tags, sitemap, robots, analytics' },
  { href: '/admin/settings/security', label: 'Security Settings', desc: 'Password policies, 2FA, IP whitelist, rate limiting' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title='Settings & Configuration' subtitle='General, booking, payment, notification, SEO, security' actionButton={<Button variant='primary' onClick={() => router.push('/admin')}>Back to Dashboard</Button>}>
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, label, desc }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{label}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{desc}</p>
            <Button variant='secondary' onClick={() => router.push(href)}>Configure</Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
