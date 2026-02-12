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

export default function AdminSpecialtiesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
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
      const res = await apiClient.get('/admin/specialties');
      const data = res.success && res.data && res.data.data ? res.data.data : [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(t('admin.failedToLoadSpecialties'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ name: '', slug: '', description: '', icon: '', order: list.length, isActive: true });
    setModal('create');
  };
  const openEdit = (s) => {
    setForm({
      name: s.name || '',
      slug: s.slug || '',
      description: s.description || '',
      icon: s.icon || '',
      order: s.order ?? 0,
      isActive: s.isActive !== false,
    });
    setModal({ type: 'edit', id: s._id });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        const res = await apiClient.post('/admin/specialties', form);
        if (res?.success) {
          showSuccess(t('admin.specialtyCreated'));
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || t('admin.createFailed'));
        }
      } else if (modal?.type === 'edit' && modal?.id) {
        const res = await apiClient.put(`/admin/specialties/${modal.id}`, form);
        if (res?.success) {
          showSuccess(t('admin.specialtyUpdated'));
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
      message: t('admin.specialtyDeleteConfirm') || 'Delete this specialty?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/admin/specialties/${id}`);
          if (res?.success) {
            showSuccess(t('admin.specialtyDeleted'));
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
          {t('admin.addSpecialty')}
        </Button>
      </div>
      <Card>
        <div className='p-6'>
          <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
            Specialties ({list.length})
          </h2>
          {authLoading || loading ? (
            <div className='flex items-center justify-center min-h-[200px]' aria-busy='true'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : list.length === 0 ? (
            <p className='text-neutral-500'>{t('admin.noSpecialtiesYet')}</p>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s._id}>
                      <td>{s.order}</td>
                      <td className='font-medium'>{s.name}</td>
                      <td className='text-neutral-600'>{s.slug}</td>
                      <td>
                        <Tag
                          className={
                            s.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }
                        >
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </td>
                      <td>
                        <div className='flex gap-2'>
                          <Button variant='secondary' size='sm' onClick={() => openEdit(s)}>
                            Edit
                          </Button>
                          <Button variant='danger' size='sm' onClick={() => handleDelete(s._id)}>
                            Delete
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
          <Card className='p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>
              {modal === 'create' ? t('admin.addSpecialty') : t('admin.editSpecialty')}
            </h3>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('common.nameRequired')}
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='e.g. Cardiologist'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder='e.g. cardiologist'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  Description
                </label>
                <textarea
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg'
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  Icon (URL or name)
                </label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder='optional'
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
                  id='active'
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor='active' className='text-sm text-neutral-700'>
                  Active
                </label>
              </div>
              <div className='flex gap-2 justify-end'>
                <Button type='button' variant='secondary' onClick={closeModal}>
                  Cancel
                </Button>
                <Button type='submit' variant='primary' disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
