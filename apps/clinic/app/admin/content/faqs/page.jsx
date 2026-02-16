'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'general', labelKey: 'admin.categoryGeneral' },
  { value: 'patients', labelKey: 'admin.categoryPatients' },
  { value: 'doctors', labelKey: 'admin.categoryDoctors' },
];

export default function AdminContentFaqsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    order: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchList();
    }
  }, [authLoading, user]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/faqs');
      const data = res.success && res.data && res.data.data ? res.data.data : [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(t('admin.failedToLoadFaqs'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({
      question: '',
      answer: '',
      category: 'general',
      order: list.length,
      isActive: true,
    });
    setModal('create');
  };
  const openEdit = (item) => {
    const id = item?.id ?? item?._id;
    if (!id) return;
    setForm({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'general',
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    setModal({ type: 'edit', id });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        const res = await apiClient.post('/admin/faqs', form);
        if (res?.success) {
          showSuccess(t('admin.faqCreated'));
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || t('admin.createFailed'));
        }
      } else if (modal?.type === 'edit' && modal?.id) {
        const res = await apiClient.put(`/admin/faqs/${modal.id}`, form);
        if (res?.success) {
          showSuccess(t('admin.faqUpdated'));
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || t('admin.updateFailed'));
        }
      }
    } catch (err) {
      showError(t('admin.requestFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    openConfirm({
      title: t('common.delete'),
      message: t('admin.faqDeleteConfirm') || 'Delete this FAQ?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/admin/faqs/${id}`);
          if (res?.success) {
            showSuccess(t('admin.faqDeleted'));
            fetchList();
          } else {
            showError(res?.error?.message || t('admin.deleteFailed'));
          }
        } catch (err) {
          showError(t('admin.deleteFailed'));
        }
      },
    });
  };

  if (user?.role !== 'super_admin' && !authLoading) return null;

  return (
    <>
      <div className='flex justify-end mb-4'>
        <Button variant='primary' onClick={openCreate}>
          {t('admin.contentAddFaq')}
        </Button>
      </div>
      <Card>
        <div className='p-6'>
          <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
            {t('admin.contentFaqs')} ({list.length})
          </h2>
          {authLoading || loading ? (
            <div className='flex items-center justify-center min-h-[200px]' aria-busy='true'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : list.length === 0 ? (
            <p className='text-neutral-500'>{t('admin.noFaqsYet')}</p>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Question</th>
                    <th>{t('admin.categoryLabel')}</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, idx) => (
                    <tr key={item?.id ?? item?._id ?? idx}>
                      <td>{item.order}</td>
                      <td className='font-medium max-w-xs truncate' title={item.question}>
                        {item.question}
                      </td>
                      <td>
                        <Tag className='bg-neutral-100 text-neutral-800'>{item.category}</Tag>
                      </td>
                      <td>
                        <Tag
                          className={
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </td>
                      <td>
                        <div className='flex gap-2'>
                          <Button variant='secondary' size='sm' onClick={() => openEdit(item)}>
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant='danger'
                            size='sm'
                            onClick={() => {
                              const id = item?.id ?? item?._id;
                              if (id) handleDelete(id);
                            }}
                          >
                            {t('common.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {modal && (
        <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
          <Card className='p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>
              {modal === 'create' ? t('admin.contentAddFaq') : t('admin.editFaq')}
            </h3>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  Question *
                </label>
                <Input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder='FAQ question'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Answer *</label>
                <textarea
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg'
                  rows={4}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder='Answer'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.categoryLabel')}
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg'
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('common.order')}
                </label>
                <Input
                  type='number'
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='faq-active'
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor='faq-active' className='text-sm text-neutral-700'>
                  Active
                </label>
              </div>
              <div className='flex gap-2 justify-end'>
                <Button type='button' variant='secondary' onClick={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button type='submit' variant='primary' disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
