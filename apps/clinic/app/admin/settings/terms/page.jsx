'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminSettingsTermsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') router.push('/dashboard');
      else fetchSettings();
    }
  }, [authLoading, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/settings/terms');
      if (res.success && res.data) setContent(res.data.content || '');
    } catch (err) {
      showError(t('admin.failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.put('/admin/settings/terms', { content });
      if (res.success) {
        showSuccess(t('admin.settingsSaved'));
        await fetchSettings();
      } else showError(res.error?.message || t('admin.failedToSaveSettings'));
    } catch (err) {
      showError(t('admin.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.termsConditions') || 'Terms & Conditions'}
      subtitle={t('admin.termsConditionsDesc') || 'Edit platform terms and conditions'}
    >
      <div className='admin-page-content'>
        <Card className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <label className='block text-sm font-medium text-neutral-700'>
              {t('admin.content') || 'Content'}
            </label>
            <textarea
              className='w-full min-h-[400px] px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('admin.termsPlaceholder')}
            />
            <div className='flex gap-2'>
              <Button type='submit' variant='primary' disabled={saving}>
                {saving ? t('common.saving') || 'Saving…' : t('common.save') || 'Save'}
              </Button>
              <Button type='button' variant='secondary' href='/admin/settings'>
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
