'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const items = [
  {
    href: '/admin/content/specialties',
    labelKey: 'admin.specialtyManagement',
    descKey: 'admin.specialtyManagementSubtitle',
  },
  { href: '/admin/content/blog', labelKey: 'admin.contentBlog', descKey: 'admin.contentBlogDesc' },
  { href: '/admin/content/faqs', labelKey: 'admin.contentFaqs', descKey: 'admin.contentFaqsDesc' },
  {
    href: '/admin/content/pages',
    labelKey: 'admin.contentPages',
    descKey: 'admin.contentPagesDesc',
  },
  {
    href: '/admin/content/banners',
    labelKey: 'admin.contentBannerManagement',
    descKey: 'admin.contentBannerManagementDesc',
  },
];

export default function AdminContentPage() {
  const router = useRouter();
  const { t } = useI18n();
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
      title={t('admin.contentManagement')}
      subtitle={t('admin.contentManagementSubtitle')}
      actionButton={
        <Button variant='primary' href='/admin'>
          {t('common.backToDashboard')}
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }} className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {items.map(({ href, labelKey, descKey }) => (
          <Card key={href} className='p-6'>
            <h3 className='text-lg font-semibold text-neutral-900 mb-2'>{t(labelKey)}</h3>
            <p className='text-sm text-neutral-600 mb-4'>{t(descKey)}</p>
            <Button variant='secondary' href={href}>
              {t('common.manage')}
            </Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
