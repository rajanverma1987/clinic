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
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
};

export default function AdminSettingsCurrencyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState(defaultValues);
  const [newCurrency, setNewCurrency] = useState('');
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
      const response = await apiClient.get('/admin/settings/currency');
      if (response.success && response.data) {
        setForm({
          defaultCurrency: response.data.defaultCurrency || 'USD',
          supportedCurrencies: Array.isArray(response.data.supportedCurrencies)
            ? response.data.supportedCurrencies
            : defaultValues.supportedCurrencies,
        });
      }
    } catch (err) {
      showError(t('admin.failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = () => {
    const code = newCurrency.trim().toUpperCase();
    if (code.length === 3 && !form.supportedCurrencies.includes(code)) {
      setForm((f) => ({
        ...f,
        supportedCurrencies: [...f.supportedCurrencies, code],
      }));
      setNewCurrency('');
    }
  };

  const handleRemoveCurrency = (code) => {
    setForm((f) => ({
      ...f,
      supportedCurrencies: f.supportedCurrencies.filter((c) => c !== code),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        defaultCurrency: form.defaultCurrency.trim().toUpperCase(),
        supportedCurrencies: form.supportedCurrencies,
      };
      const response = await apiClient.put('/admin/settings/currency', payload);
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

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout title={t('admin.settingsCurrency')} subtitle={t('admin.settingsCurrencyDesc')}>
      <div className='admin-page-content'>
        <Card className='p-6 max-w-2xl'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.defaultCurrency') || 'Default currency'}
              </label>
              <select
                className='w-full px-3 py-2 border border-neutral-300 rounded-md'
                value={form.defaultCurrency}
                onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))}
              >
                {form.supportedCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('settings.supportedCurrencies') || 'Supported currencies'}
              </label>
              <div className='flex gap-2 mb-2'>
                <Input
                  type='text'
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder={t('admin.currencyPlaceholder')}
                  maxLength={3}
                />
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleAddCurrency}
                  disabled={newCurrency.trim().length !== 3}
                >
                  {t('common.add') || 'Add'}
                </Button>
              </div>
              <div className='flex flex-wrap gap-2'>
                {form.supportedCurrencies.map((c) => (
                  <span
                    key={c}
                    className='inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 rounded-full text-sm'
                  >
                    {c}
                    <button
                      type='button'
                      className='text-neutral-500 hover:text-red-600'
                      onClick={() => handleRemoveCurrency(c)}
                      aria-label={`Remove ${c}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
