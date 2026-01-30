'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminSpecialtiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', order: 0, isActive: true });
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
      const data = (res.success && res.data && res.data.data) ? res.data.data : [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError('Failed to load specialties');
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
          showSuccess('Specialty created');
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || 'Create failed');
        }
      } else if (modal?.type === 'edit' && modal?.id) {
        const res = await apiClient.put(`/admin/specialties/${modal.id}`, form);
        if (res?.success) {
          showSuccess('Specialty updated');
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || 'Update failed');
        }
      }
    } catch (err) {
      showError('Request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this specialty?')) return;
    try {
      const res = await apiClient.delete(`/admin/specialties/${id}`);
      if (res?.success) {
        showSuccess('Specialty deleted');
        fetchList();
      } else {
        showError(res?.error?.message || 'Delete failed');
      }
    } catch (err) {
      showError('Delete failed');
    }
  };

  if (authLoading || loading) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title='Specialty Management'
      subtitle='Add, edit, reorder and activate/deactivate specialties'
      actionButton={
        <div className='flex gap-2'>
          <Button variant='secondary' size='md' onClick={() => router.push('/admin/content')}>Back to Content</Button>
          <Button variant='primary' onClick={openCreate}>Add Specialty</Button>
        </div>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-neutral-900 mb-4'>Specialties ({list.length})</h2>
            {list.length === 0 ? (
              <p className='text-neutral-500'>No specialties yet. Add one to get started.</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-neutral-200'>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Order</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Name</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Slug</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Status</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s) => (
                      <tr key={s._id} className='border-b border-neutral-100 hover:bg-neutral-50'>
                        <td className='py-2 px-3 text-sm'>{s.order}</td>
                        <td className='py-2 px-3 font-medium'>{s.name}</td>
                        <td className='py-2 px-3 text-sm text-neutral-600'>{s.slug}</td>
                        <td className='py-2 px-3'>
                          <Tag className={s.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </Tag>
                        </td>
                        <td className='py-2 px-3'>
                          <div className='flex gap-2'>
                            <Button variant='secondary' size='sm' onClick={() => openEdit(s)}>Edit</Button>
                            <Button variant='danger' size='sm' onClick={() => handleDelete(s._id)}>Delete</Button>
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
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>{modal === 'create' ? 'Add Specialty' : 'Edit Specialty'}</h3>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Name *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='e.g. Cardiologist' required />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Slug</label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder='e.g. cardiologist' />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Description</label>
                  <textarea className='w-full px-3 py-2 border border-neutral-300 rounded-lg' rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Icon (URL or name)</label>
                  <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder='optional' />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>Order</label>
                  <Input type='number' value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' id='active' checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <label htmlFor='active' className='text-sm text-neutral-700'>Active</label>
                </div>
                <div className='flex gap-2 justify-end'>
                  <Button type='button' variant='secondary' onClick={closeModal}>Cancel</Button>
                  <Button type='submit' variant='primary' disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
