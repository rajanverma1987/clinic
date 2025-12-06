'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!authLoading && user && params.id) {
      fetchItem();
    }
  }, [authLoading, user, params.id]);

  const fetchItem = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/inventory/items/${params.id}`);
      if (response.success && response.data) {
        setItem(response.data);
        setFormData(response.data);
      } else {
        setError(response.error?.message || 'Failed to load inventory item');
      }
    } catch (error) {
      console.error('Failed to fetch inventory item:', error);
      setError(error.message || 'Failed to load inventory item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Build payload - API expects prices in dollars (it will convert to cents internally)
      const payload = {
        name: formData.name,
        type: formData.type,
        unit: formData.unit,
        lowStockThreshold: formData.lowStockThreshold || 0,
      };

      // Include optional fields only if they have values
      if (formData.code) {
        payload.code = formData.code;
      }
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.expiryDate) {
        payload.expiryDate = formData.expiryDate;
      }
      if (formData.batchNumber) {
        payload.batchNumber = formData.batchNumber;
      }
      if (formData.supplier) {
        payload.supplier = formData.supplier;
      }

      // Convert prices from cents (stored in formData) to dollars (what API expects)
      // The API service will use parseAmount to convert dollars back to cents
      if (formData.costPrice !== undefined && formData.costPrice !== null) {
        payload.costPrice = formData.costPrice / 100;
      }
      if (formData.sellingPrice !== undefined && formData.sellingPrice !== null) {
        payload.sellingPrice = formData.sellingPrice / 100;
      }

      const response = await apiClient.put(`/inventory/items/${params.id}`, payload);
      if (response.success) {
        setIsEditing(false);
        setError('');
        fetchItem();
      } else {
        setError(response.error?.message || 'Failed to update inventory item');
      }
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      setError(error.message || 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return formatCurrencyUtil(amount, currency, locale);
  };

  const getStockStatus = () => {
    if (!item) return 'default';
    if (item.totalQuantity <= item.lowStockThreshold) return 'danger';
    if (item.totalQuantity <= item.lowStockThreshold * 1.5) return 'warning';
    return 'success';
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error && !item) {
    return (
      <Layout>
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            ← {t('common.back')}
          </Button>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/inventory')}>
              Back to Inventory
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          ← {t('common.back')}
        </Button>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-gray-600 mt-2">
            {item.code && <span className="mr-4">Code: {item.code}</span>}
            <Tag variant={getStockStatus()} size="sm" className="ml-2">
              {item.totalQuantity <= item.lowStockThreshold ? 'Low Stock' : 'In Stock'}
            </Tag>
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            {t('common.edit')}
          </Button>
        )}
      </div>

      {error && (
        <Card className="mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3">
            {error}
          </div>
        </Card>
      )}

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('inventory.itemName')}
              value={isEditing ? formData.name || '' : item.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              required
            />

            <Input
              label={t('inventory.code')}
              value={isEditing ? formData.code || '' : item.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g., MED-001"
            />

            <Select
              label={t('inventory.category')}
              value={isEditing ? formData.type || '' : item.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              disabled={!isEditing}
              required
              options={[
                { value: 'medicine', label: 'Medicine' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'supply', label: 'Supply' },
                { value: 'consumable', label: 'Consumable' },
                { value: 'other', label: t('common.other') },
              ]}
            />

            <Input
              label={t('inventory.unit')}
              value={isEditing ? formData.unit || '' : item.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              disabled={!isEditing}
              required
            />

            {!isEditing && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('inventory.currentStock')}
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {item.totalQuantity} {item.unit}
                    {item.availableQuantity !== item.totalQuantity && (
                      <span className="text-gray-500 ml-2">
                        ({item.availableQuantity} available)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Low Stock Threshold
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {item.lowStockThreshold} {item.unit}
                  </p>
                </div>
              </>
            )}

            {isEditing && (
              <>
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  value={formData.lowStockThreshold?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </>
            )}

            <Input
              label={t('inventory.costPrice')}
              type="number"
              step="0.01"
              value={isEditing 
                ? formData.costPrice ? (formData.costPrice / 100).toFixed(2) : '' 
                : item.costPrice ? formatCurrency(item.costPrice) : 'N/A'
              }
              onChange={(e) => setFormData({ 
                ...formData, 
                costPrice: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined 
              })}
              disabled={!isEditing}
              placeholder="0.00"
            />

            <Input
              label={t('inventory.sellingPrice')}
              type="number"
              step="0.01"
              value={isEditing 
                ? formData.sellingPrice ? (formData.sellingPrice / 100).toFixed(2) : '' 
                : item.sellingPrice ? formatCurrency(item.sellingPrice) : 'N/A'
              }
              onChange={(e) => setFormData({ 
                ...formData, 
                sellingPrice: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined 
              })}
              disabled={!isEditing}
              placeholder="0.00"
            />

            <DatePicker
              label={t('inventory.expiryDate')}
              value={isEditing && formData.expiryDate 
                ? new Date(formData.expiryDate).toISOString().split('T')[0] 
                : item.expiryDate 
                  ? new Date(item.expiryDate).toISOString().split('T')[0] 
                  : ''
              }
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value || undefined })}
              disabled={!isEditing}
            />

            <Input
              label={t('inventory.batchNumber')}
              value={isEditing ? formData.batchNumber || '' : item.batchNumber || ''}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g., BATCH-2024-001"
            />

            <Input
              label={t('inventory.supplier')}
              value={isEditing ? formData.supplier || '' : item.supplier || ''}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <Textarea
            label={t('inventory.description')}
            value={isEditing ? formData.description || '' : item.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={!isEditing}
            rows={4}
            placeholder={t('inventory.description')}
          />

          {isEditing && (
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" isLoading={saving}>
                {t('common.save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(item);
                  setError('');
                }}
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </Layout>
  );
}

