'use client';

import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useCallback, useEffect, useState } from 'react';

function toLocationRow(loc) {
  return {
    _id: loc.id || loc._id,
    id: loc.id || loc._id,
    name: loc.name,
    address: loc.address,
    phone: loc.phone,
    email: loc.email,
    isMain: !!loc.isMain,
    isActive: loc.isActive !== false,
  };
}

function toSettingsPayload(locations) {
  return locations.map((row) => ({
    id: row.id || row._id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    isMain: row.isMain,
    isActive: row.isActive,
  }));
}

export default function LocationsPage() {
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isMain: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiClient.get('/settings');
      if (!response?.success) {
        throw new Error(response?.error?.message || 'Failed to load settings');
      }
      const list = response?.data?.settings?.locations;
      setLocations(Array.isArray(list) ? list.map(toLocationRow) : []);
    } catch (err) {
      showError(err?.message || t('settings.locationSaveFailed'));
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const persistLocations = useCallback(
    async (nextLocations) => {
      setSaving(true);
      try {
        const response = await apiClient.put('/settings', {
          settings: { locations: toSettingsPayload(nextLocations) },
        });
        if (!response?.success) {
          throw new Error(response?.error?.message || 'Failed to save locations');
        }
        setLocations(nextLocations.map(toLocationRow));
        showSuccess(t('settings.locationSaved'));
        return true;
      } catch (err) {
        showError(err?.message || t('settings.locationSaveFailed'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [t],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = editingId || `loc_${Date.now()}`;
    const newRow = {
      _id: id,
      id,
      ...formData,
      isActive: true,
    };
    let next;
    if (editingId) {
      next = locations.map((r) => (r.id === editingId || r._id === editingId ? newRow : r));
    } else {
      next = [...locations, newRow];
    }
    const ok = await persistLocations(next);
    if (ok) {
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', address: '', phone: '', email: '', isMain: false });
    }
  };

  const openEdit = (row) => {
    setEditingId(row.id || row._id);
    setFormData({
      name: row.name || '',
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      isMain: !!row.isMain,
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', address: '', phone: '', email: '', isMain: false });
    setShowModal(true);
  };

  const handleDeactivate = (row) => {
    openConfirm({
      title: t('common.deactivate'),
      message: t('settings.deactivateLocationConfirm'),
      confirmLabel: t('common.deactivate'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        const next = locations.map((r) =>
          r.id === row.id || r._id === row._id ? { ...r, isActive: false } : r,
        );
        await persistLocations(next);
      },
    });
  };

  const handleActivate = async (row) => {
    const next = locations.map((r) =>
      r.id === row.id || r._id === row._id ? { ...r, isActive: true } : r,
    );
    await persistLocations(next);
  };

  const columns = [
    {
      header: t('settings.locationName'),
      accessor: (row) => (
        <div>
          <div className='font-medium'>{row.name}</div>
          {row.isMain && (
            <Tag variant='success' size='sm' className='mt-1'>
              {t('settings.location')} (Main)
            </Tag>
          )}
        </div>
      ),
    },
    { header: t('common.address'), accessor: 'address' },
    { header: t('common.phone'), accessor: 'phone' },
    { header: t('auth.email'), accessor: 'email' },
    {
      header: t('common.status', 'Status'),
      accessor: (row) => (
        <Tag variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <div className='flex gap-2'>
          <Button variant='secondary' size='sm' onClick={() => openEdit(row)}>
            {t('common.edit')}
          </Button>
          {!row.isMain && (
            <Button
              variant='secondary'
              size='sm'
              onClick={() => (row.isActive ? handleDeactivate(row) : handleActivate(row))}
            >
              {row.isActive ? t('settings.deactivate') : t('settings.activate')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const modalTitle = editingId ? t('settings.editLocation') : t('settings.addNewLocation');
  const submitLabel = editingId ? t('settings.updateLocation') : t('settings.addLocation');

  return (
    <div style={{ padding: '0 10px' }}>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-xl font-semibold text-neutral-900'>
            {t('settings.multiLocationManagement')}
          </h1>
          <p className='text-sm text-neutral-600 mt-0.5'>
            {t('settings.multiLocationDescription')}
          </p>
        </div>
        <Button onClick={openAdd} disabled={saving}>
          + {t('settings.addLocation')}
        </Button>
      </div>
      <Card>
        {loading ? (
          <div className='p-8 text-center text-neutral-600'>{t('common.loading')}</div>
        ) : (
          <Table data={locations} columns={columns} emptyMessage={t('settings.noLocationsFound')} />
        )}
      </Card>

      {showModal && (
        <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
          <Card className='max-w-md w-full mx-4'>
            <div className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>{modalTitle}</h2>

              <form onSubmit={handleSubmit} className='space-y-4' noValidate>
                <Input
                  label={t('settings.locationName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t('settings.locationNamePlaceholder')}
                />

                <Input
                  label={t('common.address')}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  placeholder={t('settings.addressPlaceholder')}
                />

                <Input
                  label={t('common.phone')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder={t('settings.phonePlaceholder')}
                />

                <Input
                  label={t('auth.email')}
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder={t('settings.emailPlaceholder')}
                />

                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='isMain'
                    checked={formData.isMain}
                    onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                    size='sm'
                  />
                  <label htmlFor='isMain' className='block text-sm text-neutral-700 cursor-pointer'>
                    {t('settings.setAsMainLocation')}
                  </label>
                </div>

                <div className='flex gap-4 pt-4'>
                  <Button type='submit' className='flex-1' disabled={saving}>
                    {submitLabel}
                  </Button>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        address: '',
                        phone: '',
                        email: '',
                        isMain: false,
                      });
                    }}
                    className='flex-1'
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
