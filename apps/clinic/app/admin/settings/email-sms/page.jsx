'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const defaultForm = {
  smtp: {
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
  },
  sms: {
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
  },
};

export default function AdminSettingsEmailSmsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState(defaultForm);
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
      const res = await apiClient.get('/admin/settings/email-sms');
      if (res.success && res.data) {
        setForm({
          smtp: { ...defaultForm.smtp, ...res.data.smtp, password: '' },
          sms: { ...defaultForm.sms, ...res.data.sms, twilioAuthToken: '' },
        });
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
        smtp: {
          ...form.smtp,
          password: form.smtp.password || undefined,
        },
        sms: {
          ...form.sms,
          twilioAuthToken: form.sms.twilioAuthToken || undefined,
        },
      };
      const res = await apiClient.put('/admin/settings/email-sms', payload);
      if (res.success) {
        showSuccess(t('admin.settingsSaved'));
      } else {
        showError(res.error?.message || t('admin.failedToSaveSettings'));
      }
    } catch (err) {
      showError(t('admin.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <Loader type="page" text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.settingsEmailSms') || 'Email/SMS Configuration'}
      subtitle={t('admin.settingsEmailSmsDesc') || 'SMTP, SMS gateway (Twilio), sender ID'}
    >
      <div className="admin-page-content space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SMTP</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={form.smtp.host}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, host: e.target.value },
                  }))
                }
                placeholder="smtp.example.com"
              />
              <Input
                label="Port"
                type="number"
                value={form.smtp.port}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, port: parseInt(e.target.value) || 587 },
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.smtp.secure}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, secure: e.target.checked },
                  }))
                }
              />
              <span className="text-sm">Use TLS/SSL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Username"
                value={form.smtp.user}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, user: e.target.value },
                  }))
                }
              />
              <Input
                label="Password"
                type="password"
                value={form.smtp.password}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, password: e.target.value },
                  }))
                }
                placeholder={form.smtp.password ? '••••••••' : ''}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="From Email"
                type="email"
                value={form.smtp.fromEmail}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, fromEmail: e.target.value },
                  }))
                }
              />
              <Input
                label="From Name"
                value={form.smtp.fromName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    smtp: { ...f.smtp, fromName: e.target.value },
                  }))
                }
              />
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">SMS (Twilio)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Twilio Account SID"
                value={form.sms.twilioAccountSid}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sms: { ...f.sms, twilioAccountSid: e.target.value },
                  }))
                }
                placeholder="ACxxxxxxxx"
              />
              <Input
                label="Twilio Auth Token"
                type="password"
                value={form.sms.twilioAuthToken}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sms: { ...f.sms, twilioAuthToken: e.target.value },
                  }))
                }
                placeholder="••••••••"
              />
            </div>
            <Input
              label="Twilio Phone Number"
              value={form.sms.twilioPhoneNumber}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sms: { ...f.sms, twilioPhoneNumber: e.target.value },
                }))
              }
              placeholder="+1234567890"
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('common.saving') || 'Saving…' : t('common.save') || 'Save'}
              </Button>
              <Button type="button" variant="secondary" href="/admin/settings">
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
