'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TEMPLATE_TYPES = ['appointment', 'prescription', 'payment', 'lab_result', 'system'];

export default function AdminSettingsTemplatesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'system',
    'channels.email.subject': '',
    'channels.email.text': '',
    'channels.sms.message': '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') router.push('/dashboard');
      else fetchTemplates();
    }
  }, [authLoading, user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/settings/templates');
      if (res.success && res.data) setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError(t('admin.failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setForm({
      name: '',
      type: 'system',
      'channels.email.subject': '',
      'channels.email.text': '',
      'channels.sms.message': '',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (t) => {
    setForm({
      name: t.name,
      type: t.type,
      'channels.email.subject': t.channels?.email?.subject || '',
      'channels.email.text': t.channels?.email?.text || '',
      'channels.sms.message': t.channels?.sms?.message || '',
    });
    setEditingId(t._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        channels: {
          email: {
            enabled: true,
            subject: form['channels.email.subject'] || '',
            text: form['channels.email.text'] || '',
          },
          sms: {
            enabled: true,
            message: form['channels.sms.message'] || '',
          },
        },
      };
      if (editingId) {
        const res = await apiClient.put(`/admin/settings/templates/${editingId}`, payload);
        if (res.success) {
          showSuccess(t('admin.settingsSaved'));
          setShowForm(false);
          await apiClient.clearCacheForEndpoint('/admin/settings');
          await fetchTemplates();
        } else showError(res.error?.message);
      } else {
        const res = await apiClient.post('/admin/settings/templates', payload);
        if (res.success) {
          showSuccess(t('admin.settingsSaved'));
          setShowForm(false);
          await apiClient.clearCacheForEndpoint('/admin/settings');
          await fetchTemplates();
        } else showError(res.error?.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = (template) => {
    openConfirm({
      title: t('common.delete'),
      message: t('admin.deleteTemplateConfirm')?.replace('{{name}}', template.name) || `Delete "${template.name}"?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/admin/settings/templates/${template._id}`);
          if (res.success) {
            showSuccess(t('admin.templateDeleted') || 'Template deleted');
            await apiClient.clearCacheForEndpoint('/admin/settings');
            await fetchTemplates();
          } else showError(res.error?.message);
        } catch (err) {
          showError(err.message);
        }
      },
    });
  };

  if (authLoading || loading) return <Loader type="page" text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const columns = [
    { header: t('admin.templateName') || 'Name', accessor: (r) => r.name },
    { header: t('admin.templateType') || 'Type', accessor: (r) => r.type },
    {
      header: t('admin.emailSubject') || 'Email Subject',
      accessor: (r) => r.channels?.email?.subject || '—',
    },
    {
      header: t('admin.smsMessage') || 'SMS',
      accessor: (r) =>
        r.channels?.sms?.message
          ? r.channels.sms.message.substring(0, 50) + (r.channels.sms.message.length > 50 ? '…' : '')
          : '—',
    },
    {
      header: t('common.actions') || 'Actions',
      accessor: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => handleEdit(r)}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => handleDelete(r)} className="text-red-600">
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout
      title={t('admin.emailSmsTemplates') || 'Email & SMS Templates'}
      subtitle={t('admin.emailSmsTemplatesDesc') || 'Platform notification templates'}
    >
      <div className="admin-page-content">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">{t('admin.templates') || 'Templates'}</h3>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              + {t('admin.addTemplate') || 'Add template'}
            </Button>
          </div>
          <Table
            data={templates}
            columns={columns}
            emptyMessage={t('admin.noTemplates') || 'No templates. Add one to get started.'}
          />
        </Card>

        {showForm && (
          <Modal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={editingId ? t('admin.editTemplate') || 'Edit template' : t('admin.addTemplate') || 'Add template'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('admin.templateName') || 'Name'}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Select
                label={t('admin.templateType') || 'Type'}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                options={TEMPLATE_TYPES.map((t) => ({ value: t, label: t }))}
              />
              <Input
                label={t('admin.emailSubject') || 'Email subject'}
                value={form['channels.email.subject']}
                onChange={(e) =>
                  setForm((f) => ({ ...f, 'channels.email.subject': e.target.value }))
                }
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.emailBody') || 'Email body'}
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={form['channels.email.text']}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, 'channels.email.text': e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.smsMessage') || 'SMS message'}
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  maxLength={160}
                  value={form['channels.sms.message']}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, 'channels.sms.message': e.target.value }))
                  }
                />
                <p className="text-xs text-neutral-500">{form['channels.sms.message']?.length || 0}/160</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
