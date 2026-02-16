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

export default function AdminContentBannersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    order: 0,
    startDate: '',
    endDate: '',
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
      const res = await apiClient.get('/admin/banners');
      const data = res.success && res.data && res.data.data ? res.data.data : [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(t('admin.failedToLoadBanners'));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const openCreate = () => {
    setForm({
      title: '',
      imageUrl: '',
      linkUrl: '',
      order: list.length,
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setModal('create');
  };
  const openEdit = (item) => {
    const id = item?.id ?? item?._id;
    if (!id) return;
    setForm({
      title: item.title || '',
      imageUrl: item.imageUrl || '',
      linkUrl: item.linkUrl || '',
      order: item.order ?? 0,
      startDate: formatDate(item.startDate),
      endDate: formatDate(item.endDate),
      isActive: item.isActive !== false,
    });
    setModal({ type: 'edit', id });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || '',
        order: form.order,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        isActive: form.isActive,
      };
      if (modal === 'create') {
        const res = await apiClient.post('/admin/banners', payload);
        if (res?.success) {
          showSuccess(t('admin.bannerCreated'));
          closeModal();
          fetchList();
        } else {
          showError(res?.error?.message || t('admin.createFailed'));
        }
      } else if (modal?.type === 'edit' && modal?.id) {
        const res = await apiClient.put(`/admin/banners/${modal.id}`, payload);
        if (res?.success) {
          showSuccess(t('admin.bannerUpdated'));
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
      message: t('admin.bannerDeleteConfirm') || 'Delete this banner?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/admin/banners/${id}`);
          if (res?.success) {
            showSuccess(t('admin.bannerDeleted'));
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
          {t('admin.contentAddBanner')}
        </Button>
      </div>
      <Card>
        <div className='p-6'>
          <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
            {t('admin.contentBannerManagement')} ({list.length})
          </h2>
          {authLoading || loading ? (
            <div className='flex items-center justify-center min-h-[200px]' aria-busy='true'>
              <Loader type='section' text={t('common.loading')} />
            </div>
          ) : list.length === 0 ? (
            <p className='text-neutral-500'>{t('admin.noBannersYet')}</p>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>{t('common.order')}</th>
                    <th>{t('common.title')}</th>
                    <th>{t('admin.contentBannerLabelImageUrl')}</th>
                    <th>{t('admin.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, idx) => (
                    <tr key={item?.id ?? item?._id ?? idx}>
                      <td>{item.order}</td>
                      <td className='font-medium'>{item.title}</td>
                      <td className='text-neutral-600 max-w-xs truncate' title={item.imageUrl}>
                        {item.imageUrl}
                      </td>
                      <td>
                        <Tag
                          className={
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }
                        >
                          {item.isActive ? t('common.active') : t('common.inactive')}
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
              {modal === 'create' ? t('admin.contentAddBanner') : t('admin.editBanner')}
            </h3>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('common.title')} *
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('admin.contentBannerPlaceholderTitle')}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.contentBannerLabelImageUrl')} *
                </label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder={t('admin.contentBannerPlaceholderImageUrl')}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.contentBannerLabelLinkUrl')}
                </label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder={t('admin.contentBannerPlaceholderLinkUrl')}
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
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.contentBannerLabelStartDate')}
                </label>
                <Input
                  type='date'
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.contentBannerLabelEndDate')}
                </label>
                <Input
                  type='date'
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='banner-active'
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor='banner-active' className='text-sm text-neutral-700'>
                  {t('common.active')}
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
