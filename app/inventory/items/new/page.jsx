'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'medicine',
    unit: 'unit',
    description: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    lowStockThreshold: '',
    expiryDate: '',
    batchNumber: '',
    supplier: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        code: formData.code || undefined,
        type: formData.type,
        unit: formData.unit,
        description: formData.description || undefined,
        costPrice: formData.costPrice
          ? Math.round(parseFloat(formData.costPrice) * 100)
          : undefined,
        sellingPrice: formData.sellingPrice
          ? Math.round(parseFloat(formData.sellingPrice) * 100)
          : undefined,
        currentStock: formData.currentStock ? parseInt(formData.currentStock) : 0,
        lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : 0,
        expiryDate: formData.expiryDate || undefined,
        batchNumber: formData.batchNumber || undefined,
        supplier: formData.supplier || undefined,
      };

      const response = await apiClient.post('/inventory/items', payload);
      if (response.success) {
        router.push('/inventory');
      } else {
        setError(response.error?.message || t('common.error'));
      }
    } catch (error) {
      setError(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-8' style={{ paddingTop: '10px' }}>
          <button
            onClick={() => router.back()}
            className='flex items-center justify-center w-10 h-10 rounded-lg border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-neutral-600 hover:text-primary-600 transition-all duration-200 mb-4'
            aria-label={t('common.back')}
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <h1 className='text-3xl font-bold text-neutral-900'>{t('inventory.addItem')}</h1>
          <p className='text-neutral-600 mt-2'>{t('inventory.items')}</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className='space-y-6' noValidate>
            {error && (
              <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3 rounded'>
                {error}
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Input
                  label={t('inventory.itemName') + ' *'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder='e.g., Paracetamol 500mg'
                />
              </div>

              <div>
                <Input
                  label='Code'
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder='e.g., MED-001'
                />
              </div>

              <Select
                label={t('inventory.category')}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                options={[
                  { value: 'medicine', label: 'Medicine' },
                  { value: 'equipment', label: 'Equipment' },
                  { value: 'supply', label: 'Supply' },
                  { value: 'consumable', label: 'Consumable' },
                  { value: 'other', label: t('common.other') },
                ]}
              />

              <div>
                <Input
                  label={t('inventory.unit') + ' *'}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  placeholder='e.g., box, bottle, pack'
                />
              </div>

              <div>
                <Input
                  label='Purchase Cost'
                  type='number'
                  step='0.01'
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder='0.00'
                />
                <p className='text-sm text-neutral-500 mt-1'>Cost price per unit (what you pay)</p>
              </div>

              <div>
                <Input
                  label='Selling Price *'
                  type='number'
                  step='0.01'
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder='0.00'
                  required
                />
                <p className='text-sm text-neutral-500 mt-1'>
                  Selling price per unit (what customers pay)
                </p>
              </div>

              <div>
                <Input
                  label={t('inventory.currentStock') + ' *'}
                  type='number'
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  required
                  placeholder='0'
                />
                <p className='text-sm text-neutral-500 mt-1'>Initial stock quantity</p>
              </div>

              <div>
                <Input
                  label={t('inventory.lowStockThreshold') + ' *'}
                  type='number'
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  required
                  placeholder='10'
                />
                <p className='text-sm text-neutral-500 mt-1'>{t('inventory.lowStockAlert')}</p>
              </div>

              <DatePicker
                label={t('inventory.expiryDate')}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />

              <div>
                <Input
                  label={t('inventory.batchNumber')}
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder='e.g., BATCH-2024-001'
                />
              </div>

              <div>
                <Input
                  label={t('inventory.supplier')}
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder='Supplier name or ID'
                />
              </div>

              <div className='md:col-span-2'>
                <Textarea
                  label={t('invoices.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder={t('invoices.description')}
                />
              </div>
            </div>

            <div className='flex gap-4 justify-end pt-4 border-t'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type='submit' isLoading={isLoading} disabled={isLoading}>
                {t('inventory.addItem')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
