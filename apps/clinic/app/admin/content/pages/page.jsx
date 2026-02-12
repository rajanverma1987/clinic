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

const PAGE_KEY_OPTIONS = [
  { value: 'about', labelKey: 'admin.pageKeyAbout' },
  { value: 'contact', labelKey: 'admin.pageKeyContact' },
  { value: 'terms', labelKey: 'admin.pageKeyTerms' },
  { value: 'privacy', labelKey: 'admin.pageKeyPrivacy' },
];

export default function AdminContentPagesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    key: 'about',
    title: '',
    body: '',
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
      const res = await apiClient.get('/admin/pages');
      const data = res.success && res.data && res.data.data ? res.data.data : [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(t('admin.failedToLoadPages'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({
      key: 'about',
      title: '',
      body: '',
      order: list.length,
      isActive: true,
    });
    setModal('create');
  };
  const openEdit = (item) => {
    setForm({
      key: item.key || 'about',
      title: item.title || '',
      body: item.body || '',
      order: item.order ?? 0,
      isActive: item.isActive !== false,
    });
    setModal({ type: 'edit', id: item._id });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        const res = await apiClient.post('/admin/pages', form);
        if (res?.success) {
          showSuccess(t('admin.pageCreated'));
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || t('admin.createFailed'));
        }
      } else if (modal?.type === 'edit' && modal?.id) {
        const res = await apiClient.put(`/admin/pages/${modal.id}`, form);
        if (res?.success) {
          showSuccess(t('admin.pageUpdated'));
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
      message: t('admin.pageDeleteConfirm') || 'Delete this page?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/admin/pages/${id}`);
          if (res?.success) {
            showSuccess(t('admin.pageDeleted'));
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

  const getKeyLabel = (key) => {
    const o = PAGE_KEY_OPTIONS.find((p) => p.value === key);
    return o ? t(o.labelKey) : key;
  };

  if (user?.role !== 'super_admin' && !authLoading) return null;

  return (
    <>
      <div className='flex justify-end mb-4'>
        <Button variant='primary' onClick={openCreate}>
          {t('admin.contentEditPages')}
        </Button>
      </div>
      <Card>
        <div className='p-6'>
          <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
            {t('admin.contentPages')} ({list.length})
          </h2>
          {authLoading || loading ? (
            <div className='flex items-center justify-center min-h-[200px]' aria-busy='true'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : list.length === 0 ? (
            <p className='text-neutral-500'>{t('admin.noStaticPagesYet')}</p>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>{t('admin.pageKeyLabel')}</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item._id}>
                      <td>{item.order}</td>
                      <td>
                        <Tag className='bg-neutral-100 text-neutral-800'>
                          {getKeyLabel(item.key)}
                        </Tag>
                      </td>
                      <td className='font-medium'>{item.title}</td>
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
                          <Button variant='danger' size='sm' onClick={() => handleDelete(item._id)}>
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
              {modal === 'create' ? t('admin.contentEditPages') : t('admin.editPage')}
            </h3>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.pageKeyLabel')}
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg'
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                >
                  {PAGE_KEY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('common.title')} *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder='Page title'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Body</label>
                <textarea
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg'
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder='Page content'
                />
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
                  id='page-active'
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor='page-active' className='text-sm text-neutral-700'>
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
