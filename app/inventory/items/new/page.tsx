'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/DatePicker';

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) : undefined,
        sellingPrice: formData.sellingPrice ? Math.round(parseFloat(formData.sellingPrice) * 100) : undefined,
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
    } catch (error: any) {
      setError(error.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{t('inventory.addItem')}</h1>
        <p className="text-gray-600 mt-2">{t('inventory.items')}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label={t('inventory.itemName') + ' *'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Paracetamol 500mg"
              />
            </div>

            <div>
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MED-001"
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
                placeholder="e.g., box, bottle, pack"
              />
            </div>

            <div>
              <Input
                label="Purchase Cost"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-1">Cost price per unit (what you pay)</p>
            </div>

            <div>
              <Input
                label="Selling Price *"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Selling price per unit (what customers pay)</p>
            </div>

            <div>
              <Input
                label={t('inventory.currentStock') + ' *'}
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                required
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">Initial stock quantity</p>
            </div>

            <div>
              <Input
                label={t('inventory.lowStockThreshold') + ' *'}
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                required
                placeholder="10"
              />
              <p className="text-sm text-gray-500 mt-1">{t('inventory.lowStockAlert')}</p>
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
                placeholder="e.g., BATCH-2024-001"
              />
            </div>

            <div>
              <Input
                label={t('inventory.supplier')}
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name or ID"
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label={t('invoices.description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder={t('invoices.description')}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {t('inventory.addItem')}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

