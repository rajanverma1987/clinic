'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const defaultValues = {
  platformName: '',
  supportEmail: '',
  supportPhone: '',
  businessHours: '',
  timezone: 'UTC',
  dateFormat: 'MM/dd/yyyy',
  currencyFormat: 'USD',
};

export default function AdminSettingsGeneralPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchSettings();
    }
  }, [authLoading, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/settings/general');
      if (response.success && response.data) {
        setForm({ ...defaultValues, ...response.data });
      }
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
      const response = await apiClient.put('/admin/settings/general', form);
      if (response.success) {
        showSuccess(t('admin.settingsSaved'));
        await apiClient.clearCacheForEndpoint('/admin/settings');
        await fetchSettings();
      } else {
        showError(response.error?.message || t('admin.failedToSaveSettings'));
      }
    } catch (err) {
      showError(t('admin.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Layout loading />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.settingsGeneralTitle')}
      subtitle={t('admin.settingsGeneralSubtitle')}
    >
      <div className='admin-page-content'>
        <Card className='p-6 max-w-2xl'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.settingsPlatformName')}
              </label>
              <Input
                type='text'
                value={form.platformName}
                onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderPlatformName')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.settingsSupportEmail')}
              </label>
              <Input
                type='email'
                value={form.supportEmail}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderSupportEmail')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.settingsSupportPhone')}
              </label>
              <Input
                type='text'
                value={form.supportPhone}
                onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderSupportPhone')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.settingsBusinessHours')}
              </label>
              <Input
                type='text'
                value={form.businessHours}
                onChange={(e) => setForm((f) => ({ ...f, businessHours: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderBusinessHours')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.timezone')}
              </label>
              <Input
                type='text'
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderTimezone')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.dateFormat')}
              </label>
              <Input
                type='text'
                value={form.dateFormat}
                onChange={(e) => setForm((f) => ({ ...f, dateFormat: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderDateFormat')}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.currencyFormat')}
              </label>
              <Input
                type='text'
                value={form.currencyFormat}
                onChange={(e) => setForm((f) => ({ ...f, currencyFormat: e.target.value }))}
                placeholder={t('admin.settingsPlaceholderCurrencyFormat')}
              />
            </div>
            <div className='flex gap-2 pt-4'>
              <Button type='submit' variant='primary' disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
              <Button type='button' variant='secondary' href='/admin/settings'>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
