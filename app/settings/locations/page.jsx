'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LocationsPage() {
  const router = useRouter();
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
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-neutral-900'>Multi-Location Management</h1>
          <p className='text-neutral-600 mt-2'>Manage multiple clinic locations</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Location</Button>
      </div>

      <Card>
        <Table data={locations} columns={columns} emptyMessage='No locations found' />
      </Card>

      {/* Add Location Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <Card className='max-w-md w-full mx-4'>
            <div className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Add New Location</h2>

              <form onSubmit={handleSubmit} className='space-y-4' noValidate>
                <Input
                  label='Location Name'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder='e.g., Downtown Branch'
                />

                <Input
                  label='Address'
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  placeholder='Street address'
                />

                <Input
                  label='Phone'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder='+1234567890'
                />

                <Input
                  label='Email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder='location@clinic.com'
                />

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='isMain'
                    checked={formData.isMain}
                    onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                    className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded'
                  />
                  <label htmlFor='isMain' className='ml-2 block text-sm text-neutral-700'>
                    Set as main location
                  </label>
                </div>

                <div className='flex gap-4 pt-4'>
                  <Button type='submit' className='flex-1'>
                    Add Location
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
                    Cancel
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
