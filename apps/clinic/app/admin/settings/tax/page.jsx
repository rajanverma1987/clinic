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

const TAX_TYPES = ['NONE', 'GST', 'VAT', 'SALES_TAX'];

const defaultValues = {
  defaultTaxType: 'NONE',
  defaultTaxRate: 0,
  defaultCountry: '',
};

export default function AdminSettingsTaxPage() {
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
      const response = await apiClient.get('/admin/settings/tax');
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
      const payload = {
        ...form,
        defaultTaxRate: Number(form.defaultTaxRate) || 0,
      };
      const response = await apiClient.put('/admin/settings/tax', payload);
      if (response.success) {
        showSuccess(t('admin.settingsSaved'));
        if (response.data) setForm((f) => ({ ...f, ...response.data }));
      } else {
        showError(response.error?.message || t('admin.failedToSaveSettings'));
      }
    } catch (err) {
      showError(t('admin.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout title={t('admin.settingsTax')} subtitle={t('admin.settingsTaxDesc')}>
      <div className='admin-page-content'>
        <Card className='p-6 max-w-2xl'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.defaultTaxType') || 'Default tax type'}
              </label>
              <select
                className='w-full px-3 py-2 border border-neutral-300 rounded-md'
                value={form.defaultTaxType}
                onChange={(e) => setForm((f) => ({ ...f, defaultTaxType: e.target.value }))}
              >
                {TAX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.defaultTaxRate') || 'Default tax rate (%)'}
              </label>
              <Input
                type='number'
                min={0}
                max={100}
                step={0.01}
                value={form.defaultTaxRate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    defaultTaxRate: e.target.value,
                  }))
                }
                placeholder='0'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.defaultTaxCountry') || 'Default country'}
              </label>
              <Input
                type='text'
                value={form.defaultCountry}
                onChange={(e) => setForm((f) => ({ ...f, defaultCountry: e.target.value }))}
                placeholder='e.g. US, IN'
              />
            </div>
            <div className='flex gap-2 pt-4'>
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
