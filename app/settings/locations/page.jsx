'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useI18n } from '@/contexts/I18nContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LocationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [locations, setLocations] = useState([
    {
      _id: '1',
      name: 'Main Clinic',
      address: '123 Medical Center Dr, City',
      phone: '+1234567890',
      email: 'main@clinic.com',
      isMain: true,
      isActive: true,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isMain: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Call API to create location
    const newLocation = {
      _id: Date.now().toString(),
      ...formData,
      isActive: true,
    };
    setLocations([...locations, newLocation]);
    setShowModal(false);
    setFormData({ name: '', address: '', phone: '', email: '', isMain: false });
  };

  const columns = [
    {
      header: 'Location Name',
      accessor: (row) => (
        <div>
          <div className='font-medium'>{row.name}</div>
          {row.isMain && (
            <Tag variant='success' size='sm' className='mt-1'>
              Main Location
            </Tag>
          )}
        </div>
      ),
    },
    { header: 'Address', accessor: 'address' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Status',
      accessor: (row) => (
        <Tag variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className='flex gap-2'>
          <Button variant='secondary' size='sm'>
            Edit
          </Button>
          {!row.isMain && (
            <Button variant='secondary' size='sm'>
              {row.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout
      title={t('settings.multiLocationManagement')}
      subtitle={t('settings.multiLocationDescription')}
      actionButton={
        <Button onClick={() => setShowModal(true)}>+ {t('settings.addLocation')}</Button>
      }
    >
      <div style={{ padding: '0 10px' }}>

      <Card>
        <Table data={locations} columns={columns} emptyMessage={t('settings.noLocationsFound')} />
      </Card>

      {/* Add Location Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <Card className='max-w-md w-full mx-4'>
            <div className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>{t('settings.addNewLocation')}</h2>

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
                  <Button type='submit' className='flex-1'>
                    {t('settings.addLocation')}
                  </Button>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ name: '', address: '', phone: '', email: '', isMain: false });
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
    </Layout>
  );
}
