'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminSettingsSeoPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title={t('admin.settingsSeoTitle')} subtitle={t('admin.settingsSeoSubtitle')}>
      <div className='admin-page-content'>
        <Card className='p-6'>
          <p className='text-neutral-600'>{t('admin.settingsSeoBody')}</p>
        </Card>
      </div>
    </Layout>
  );
}
