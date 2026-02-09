'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { ADMIN_CONTENT_CHILDREN } from '@/lib/constants/dashboard-structure';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminContentPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') router.push('/dashboard');
  }, [authLoading, user, router]);
  if (authLoading || user?.role !== 'super_admin') return null;
  return (
    <Layout title={t('admin.contentManagement')} subtitle={t('admin.contentManagementSubtitle')}>
      <div className='admin-hub-content'>
        <div className='admin-hub-grid'>
          {ADMIN_CONTENT_CHILDREN.map(({ path, labelKey, descKey }) => (
            <Card key={path} className='admin-hub-card'>
              <h2 className='admin-hub-card__title'>{t(labelKey)}</h2>
              <p className='admin-hub-card__desc'>{t(descKey)}</p>
              <div className='admin-hub-card__action'>
                <Button variant='secondary' href={path}>
                  {t('common.manage')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
