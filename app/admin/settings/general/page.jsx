'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
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
      showError('Failed to load settings');
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
        showSuccess('Settings saved');
        if (response.data) setForm((f) => ({ ...f, ...response.data }));
      } else {
        showError(response.error?.message || 'Failed to save');
      }
    } catch (err) {
      showError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title='General Settings'
      subtitle='Platform name, support contact, business hours, timezone, date and currency format'
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin/settings')}>
          Back to Settings
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6 max-w-2xl'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Platform name</label>
              <Input
                type='text'
                value={form.platformName}
                onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
                placeholder='Clinic Tool'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Support email</label>
              <Input
                type='email'
                value={form.supportEmail}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
                placeholder='support@example.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Support phone</label>
              <Input
                type='text'
                value={form.supportPhone}
                onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
                placeholder='+1 234 567 8900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Business hours</label>
              <Input
                type='text'
                value={form.businessHours}
                onChange={(e) => setForm((f) => ({ ...f, businessHours: e.target.value }))}
                placeholder='Mon–Fri 9:00–17:00'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Timezone</label>
              <Input
                type='text'
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder='UTC'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Date format</label>
              <Input
                type='text'
                value={form.dateFormat}
                onChange={(e) => setForm((f) => ({ ...f, dateFormat: e.target.value }))}
                placeholder='MM/dd/yyyy'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Currency format</label>
              <Input
                type='text'
                value={form.currencyFormat}
                onChange={(e) => setForm((f) => ({ ...f, currencyFormat: e.target.value }))}
                placeholder='USD'
              />
            </div>
            <div className='flex gap-2 pt-4'>
              <Button type='submit' variant='primary' disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button type='button' variant='secondary' onClick={() => router.push('/admin/settings')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
