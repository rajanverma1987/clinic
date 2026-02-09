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
  sessionTimeoutMinutes: 30,
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  require2FAForAdmin: false,
  failedLoginMaxAttempts: 5,
  failedLoginLockoutMinutes: 15,
  ipWhitelistEnabled: false,
  auditLogRetentionDays: 365,
};

export default function AdminSettingsSecurityPage() {
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
      const response = await apiClient.get('/admin/settings/security');
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
    const session = Math.min(1440, Math.max(5, Number(form.sessionTimeoutMinutes) || 30));
    const pwdLen = Math.min(32, Math.max(6, Number(form.passwordMinLength) || 8));
    const maxAttempts = Math.min(20, Math.max(3, Number(form.failedLoginMaxAttempts) || 5));
    const lockout = Math.min(1440, Math.max(5, Number(form.failedLoginLockoutMinutes) || 15));
    const retention = Math.min(3650, Math.max(30, Number(form.auditLogRetentionDays) || 365));
    try {
      setSaving(true);
      const payload = {
        sessionTimeoutMinutes: session,
        passwordMinLength: pwdLen,
        passwordRequireSpecial: !!form.passwordRequireSpecial,
        require2FAForAdmin: !!form.require2FAForAdmin,
        failedLoginMaxAttempts: maxAttempts,
        failedLoginLockoutMinutes: lockout,
        ipWhitelistEnabled: !!form.ipWhitelistEnabled,
        auditLogRetentionDays: retention,
      };
      const response = await apiClient.put('/admin/settings/security', payload);
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
    <Layout
      title='Security Settings'
      subtitle='Session timeout, password policy, 2FA, failed login lockout, IP whitelist, audit log retention'
      actionButton={
        <Button variant='primary' href='/admin/settings'>
          Back to Settings
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='p-6 max-w-2xl'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Session timeout (minutes)
              </label>
              <Input
                type='number'
                min={5}
                max={1440}
                value={form.sessionTimeoutMinutes}
                onChange={(e) => setForm((f) => ({ ...f, sessionTimeoutMinutes: e.target.value }))}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Password minimum length
              </label>
              <Input
                type='number'
                min={6}
                max={32}
                value={form.passwordMinLength}
                onChange={(e) => setForm((f) => ({ ...f, passwordMinLength: e.target.value }))}
              />
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='passwordRequireSpecial'
                checked={form.passwordRequireSpecial}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passwordRequireSpecial: e.target.checked }))
                }
                className='rounded border-neutral-300'
              />
              <label
                htmlFor='passwordRequireSpecial'
                className='text-sm font-medium text-neutral-700'
              >
                Require special characters in password
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='require2FAForAdmin'
                checked={form.require2FAForAdmin}
                onChange={(e) => setForm((f) => ({ ...f, require2FAForAdmin: e.target.checked }))}
                className='rounded border-neutral-300'
              />
              <label htmlFor='require2FAForAdmin' className='text-sm font-medium text-neutral-700'>
                Require 2FA for admin users
              </label>
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Failed login max attempts
              </label>
              <Input
                type='number'
                min={3}
                max={20}
                value={form.failedLoginMaxAttempts}
                onChange={(e) => setForm((f) => ({ ...f, failedLoginMaxAttempts: e.target.value }))}
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Failed login lockout (minutes)
              </label>
              <Input
                type='number'
                min={5}
                max={1440}
                value={form.failedLoginLockoutMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, failedLoginLockoutMinutes: e.target.value }))
                }
              />
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='ipWhitelistEnabled'
                checked={form.ipWhitelistEnabled}
                onChange={(e) => setForm((f) => ({ ...f, ipWhitelistEnabled: e.target.checked }))}
                className='rounded border-neutral-300'
              />
              <label htmlFor='ipWhitelistEnabled' className='text-sm font-medium text-neutral-700'>
                Enable IP whitelist (configure in IP Whitelist page)
              </label>
            </div>
            <div>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                Audit log retention (days)
              </label>
              <Input
                type='number'
                min={30}
                max={3650}
                value={form.auditLogRetentionDays}
                onChange={(e) => setForm((f) => ({ ...f, auditLogRetentionDays: e.target.value }))}
              />
            </div>
            <div className='flex gap-2 pt-4'>
              <Button type='submit' variant='primary' disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type='button'
                variant='secondary'
                href='/admin/settings'
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
