'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  { href: '/admin/content/specialties', label: 'Specialty Management', desc: 'Add, edit, reorder and activate/deactivate specialties' },
  { href: '/admin/content/blog', label: 'Blog / Articles', desc: 'Create health articles, rich text, SEO, publish/draft' },
  { href: '/admin/content/faqs', label: 'FAQs', desc: 'Add FAQs, categorize Patients/Doctors/General, reorder' },
  { href: '/admin/content/pages', label: 'Static Pages', desc: 'Edit About, Contact, Terms, Privacy, footer links' },
  { href: '/admin/content/banners', label: 'Banner Management', desc: 'Homepage sliders, promotional banners, schedule' },
];

export default function AdminContentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title='Content Management'
      subtitle='Manage website content'
      actionButton={<Button variant='primary' onClick={() => router.push('/admin')}>Back to Dashboard</Button>}
    >
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, label, desc }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{label}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{desc}</p>
            <Button variant='secondary' onClick={() => router.push(href)}>Manage</Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
