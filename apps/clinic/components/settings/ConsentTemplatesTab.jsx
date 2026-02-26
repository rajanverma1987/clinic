'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';
import { SettingsTabHeader } from './SettingsTabHeader';

export function ConsentTemplatesTab() {
  const { t } = useI18n();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: '',
    isActive: true,
  });

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/consent-forms', { params: { limit: 100 } });
      if (res.success && res.data?.items) {
        setForms(res.data.items);
      } else {
        setForms([]);
      }
    } catch (_err) {
      setForms([]);
      showError(t('consent.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', content: '', type: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (form) => {
    setEditingId(form._id);
    setFormData({
      name: form.name || '',
      content: form.content || '',
      type: form.type || '',
      isActive: form.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.content?.trim()) {
      showError(t('consent.nameAndContentRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await apiClient.put(`/consent-forms/${editingId}`, formData);
        if (res.success) {
          showSuccess(t('consent.saved'));
          setShowModal(false);
          fetchForms();
        } else {
          showError(res.error?.message || t('consent.saveFailed'));
        }
      } else {
        const res = await apiClient.post('/consent-forms', formData);
        if (res.success) {
          showSuccess(t('consent.created'));
          setShowModal(false);
          fetchForms();
        } else {
          showError(res.error?.message || t('consent.saveFailed'));
        }
      }
    } catch (err) {
      showError(err?.message || t('consent.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('consent.confirmDelete'))) return;
    setSaving(true);
    try {
      const res = await apiClient.delete(`/consent-forms/${id}`);
      if (res.success) {
        showSuccess(t('consent.deleted'));
        fetchForms();
      } else {
        showError(res.error?.message || t('consent.deleteFailed'));
      }
    } catch (err) {
      showError(err?.message || t('consent.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      <SettingsTabHeader title={t('settings.consentTemplates')} />
      <Card>
        <div className='p-5'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100'>
              {t('consent.templates')}
            </h3>
            <Button type='button' variant='primary' size='sm' onClick={openCreate}>
              {t('consent.addTemplate')}
            </Button>
          </div>
          {loading ? (
            <Loader type='section' text={t('common.loading')} />
          ) : forms.length === 0 ? (
            <p className='text-sm text-neutral-500 dark:text-neutral-400'>{t('consent.noTemplates')}</p>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>{t('consent.name')}</th>
                    <th>{t('consent.type')}</th>
                    <th>{t('common.status')}</th>
                    <th className='text-right'>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form._id}>
                      <td className='font-medium'>{form.name}</td>
                      <td>{form.type || '—'}</td>
                      <td>
                        <span
                          className={
                            form.isActive
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }
                        >
                          {form.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className='text-right'>
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={() => openEdit(form)}
                          className='mr-2'
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={() => handleDelete(form._id)}
                          disabled={saving}
                        >
                          {t('common.delete')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingId ? t('consent.editTemplate') : t('consent.addTemplate')}
        size='md'
      >
        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
              {t('consent.name')} <span className='text-red-500'>*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('consent.namePlaceholder')}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
              {t('consent.type')}
            </label>
            <Input
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder={t('consent.typePlaceholder')}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
              {t('consent.content')} <span className='text-red-500'>*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t('consent.contentPlaceholder')}
              rows={6}
              className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm'
              required
            />
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='consent-active'
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className='rounded border-neutral-300'
            />
            <label htmlFor='consent-active' className='text-sm text-neutral-700 dark:text-neutral-300'>
              {t('consent.active')}
            </label>
          </div>
          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='secondary' size='sm' onClick={() => setShowModal(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type='submit' variant='primary' size='sm' isLoading={saving} disabled={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
