'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const localeCode = (i18nLocale || 'en').slice(0, 2);
  const managerReadOnly = isManagerPathReadOnly(pathname);
  const { currency, locale } = useSettings();
  const settingsLocaleCode = (locale || 'en').toString().slice(0, 2);
  const effectiveLocale = settingsLocaleCode || localeCode;

  /** Item name by locale: name_ar/name_es when set, else transliterate/translate like item names elsewhere */
  const getItemDisplayName = useCallback(
    (name, nameAr, nameEs) => {
      if (effectiveLocale === 'ar') return (nameAr && String(nameAr).trim()) || (name ? transliterateToArabic(String(name).trim()) || name : '');
      if (effectiveLocale === 'es') return (nameEs && String(nameEs).trim()) || (name ? String(name).trim().split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || name : '');
      return (name && String(name).trim()) || '';
    },
    [effectiveLocale],
  );

  /** Same as clinic account item names: transliterate to Arabic, translate to Spanish for batch number / quantity display */
  const getDisplayValue = useCallback(
    (str, locale) => {
      if (str == null || String(str).trim() === '') return '';
      const s = String(str).trim();
      const code = (locale || effectiveLocale).slice(0, 2);
      if (code === 'ar') return transliterateToArabic(s) || s;
      if (code === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
      return s;
    },
    [effectiveLocale],
  );

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addingStock, setAddingStock] = useState(false);
  const [stockFormData, setStockFormData] = useState({
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    purchaseDate: '',
    costPrice: '',
    supplier: '',
  });

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
        setError(response.error?.message || t('inventory.failedToLoadItem'));
      }
    } catch (error) {
      logger.error('Failed to fetch inventory item:', error);
      setError(error.message || t('inventory.failedToLoadItem'));
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

      // Include stock quantities
      if (formData.totalQuantity !== undefined) {
        payload.totalQuantity = formData.totalQuantity;
      }
      if (formData.availableQuantity !== undefined) {
        payload.availableQuantity = formData.availableQuantity;
      }

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
        setError(response.error?.message || t('inventory.failedToUpdateItem'));
      }
    } catch (error) {
      logger.error('Failed to update inventory item:', error);
      setError(error.message || t('inventory.failedToUpdateItem'));
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return t('common.na');
    return formatCurrencyUtil(amount, currency, locale);
  };

  const handleAddStock = async () => {
    if (!stockFormData.batchNumber || !stockFormData.quantity) {
      setError(t('inventory.batchNumberRequired'));
      return;
    }

    setAddingStock(true);
    setError('');

    try {
      const payload = {
        batchNumber: stockFormData.batchNumber,
        quantity: parseInt(stockFormData.quantity, 10),
      };

      if (stockFormData.expiryDate) {
        payload.expiryDate = stockFormData.expiryDate;
      }
      if (stockFormData.purchaseDate) {
        payload.purchaseDate = stockFormData.purchaseDate;
      }
      if (stockFormData.costPrice) {
        payload.costPrice = Math.round(parseFloat(stockFormData.costPrice) * 100);
      }
      if (stockFormData.supplier) {
        payload.supplier = stockFormData.supplier;
      }

      const response = await apiClient.post(`/inventory/items/${params.id}/stock`, payload);

      if (response.success) {
        setShowAddStockModal(false);
        setStockFormData({
          batchNumber: '',
          quantity: '',
          expiryDate: '',
          purchaseDate: '',
          costPrice: '',
          supplier: '',
        });
        fetchItem();
      } else {
        setError(response.error?.message || t('inventory.failedToAddStock'));
      }
    } catch (err) {
      logger.error('Failed to add stock:', err);
      setError(err.message || t('inventory.failedToAddStock'));
    } finally {
      setAddingStock(false);
    }
  };

  const getStockStatus = () => {
    if (!item) return 'default';
    const available = item.availableQuantity ?? 0;
    const threshold = item.lowStockThreshold ?? 0;
    if (available <= threshold) return 'danger';
    if (available <= threshold * 1.5) return 'warning';
    return 'success';
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

  if (loading) {
    return <Layout loading />;
  }

  if (error && !item) {
    return (
      <Layout>
        <div style={{ padding: '0 10px' }}>
          <Card>
            <div className='text-center py-8'>
              <p className='text-status-error'>{error}</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return null;
  }

  const displayName =
    (localeCode === 'ar' && item.name_ar) ? item.name_ar
      : (localeCode === 'es' && item.name_es) ? item.name_es
      : item.name;

  return (
    <Layout>
      <PageHeader
        title={displayName}
        subtitle={
          <>
            {item.code && (
              <span className='mr-4'>
                {t('inventory.code')}: {item.code}
              </span>
            )}
            <Tag variant={getStockStatus()} size='sm' className='ml-2'>
              {(item.availableQuantity ?? 0) <= (item.lowStockThreshold ?? 0)
                ? t('inventory.lowStock')
                : t('inventory.inStock')}
            </Tag>
          </>
        }
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            {!(user?.role === 'manager' && managerReadOnly) && !isEditing && (
              <>
                <Button
                  variant='secondary'
                  onClick={() => setShowAddStockModal(true)}
                  className='mr-2'
                >
                  + {t('inventory.addStock')}
                </Button>
                <Button onClick={() => setIsEditing(true)}>{t('common.edit')}</Button>
              </>
            )}
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        {error && (
          <Card className='mb-6'>
            <div className='bg-status-error/10 border-l-4 border-status-error text-status-error px-4 py-3'>
              {error}
            </div>
          </Card>
        )}

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className='space-y-6'
          >
            <div className='content-grid-2 content-grid-gap-6'>
              <Input
                label={t('inventory.itemName')}
                value={isEditing ? formData.name || '' : getItemDisplayName(item.name, item.name_ar, item.name_es) || item.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                required
              />

              {isEditing && (
                <>
                  <Input
                    label={t('inventory.itemNameArabic')}
                    value={formData.name_ar || ''}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder={t('inventory.itemNamePlaceholder')}
                  />
                  <Input
                    label={t('inventory.itemNameSpanish')}
                    value={formData.name_es || ''}
                    onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                    placeholder={t('inventory.itemNamePlaceholder')}
                  />
                </>
              )}

              <Input
                label={t('inventory.code')}
                value={isEditing ? formData.code || '' : item.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!isEditing}
                placeholder={t('inventory.placeholderItemCode')}
              />

              <Select
                label={t('inventory.category')}
                value={isEditing ? formData.type || '' : item.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={!isEditing}
                required
                options={[
                  { value: 'medicine', label: t('inventory.medicine') },
                  { value: 'equipment', label: t('inventory.equipment') },
                  { value: 'supply', label: t('inventory.supply') },
                  { value: 'consumable', label: t('inventory.consumable') },
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
                    <label className='block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2'>
                      {t('inventory.currentStock')}
                    </label>
                    <p className='text-lg font-medium text-neutral-900 dark:text-neutral-100'>
                      {item.totalQuantity} {item.unit}
                      {item.availableQuantity !== item.totalQuantity && (
                        <span className='text-neutral-500 dark:text-neutral-400 ml-2'>
                          ({item.availableQuantity} {t('inventory.available')})
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2'>
                      {t('inventory.lowStockThreshold')}
                    </label>
                    <p className='text-lg font-medium text-neutral-900 dark:text-neutral-100'>
                      {item.lowStockThreshold} {item.unit}
                    </p>
                  </div>
                </>
              )}

              {isEditing && (
                <>
                  <Input
                    label={t('inventory.currentStock')}
                    type='number'
                    value={formData.totalQuantity?.toString() || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, totalQuantity: val, availableQuantity: val });
                    }}
                    min='0'
                  />
                  <Input
                    label={t('inventory.lowStockThreshold')}
                    type='number'
                    value={formData.lowStockThreshold?.toString() || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })
                    }
                    required
                    min='0'
                  />
                </>
              )}

              <Input
                label={t('inventory.costPrice')}
                type='number'
                step='0.01'
                value={
                  isEditing
                    ? formData.costPrice
                      ? (formData.costPrice / 100).toFixed(2)
                      : ''
                    : item.costPrice
                      ? formatCurrency(item.costPrice)
                      : t('common.na')
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: e.target.value
                      ? Math.round(parseFloat(e.target.value) * 100)
                      : undefined,
                  })
                }
                disabled={!isEditing}
                placeholder={t('inventory.placeholderPrice')}
              />

              <Input
                label={t('inventory.sellingPrice')}
                type='number'
                step='0.01'
                value={
                  isEditing
                    ? formData.sellingPrice
                      ? (formData.sellingPrice / 100).toFixed(2)
                      : ''
                    : item.sellingPrice
                      ? formatCurrency(item.sellingPrice)
                      : t('common.na')
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: e.target.value
                      ? Math.round(parseFloat(e.target.value) * 100)
                      : undefined,
                  })
                }
                disabled={!isEditing}
                placeholder={t('inventory.placeholderPrice')}
              />

              <DatePicker
                label={t('inventory.expiryDate')}
                value={
                  isEditing && formData.expiryDate
                    ? new Date(formData.expiryDate).toISOString().split('T')[0]
                    : item.expiryDate
                      ? new Date(item.expiryDate).toISOString().split('T')[0]
                      : ''
                }
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value || undefined })
                }
                disabled={!isEditing}
              />

              <Input
                label={t('inventory.batchNumber')}
                value={isEditing ? formData.batchNumber || '' : item.batchNumber || ''}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                disabled={!isEditing}
                placeholder={t('inventory.placeholderBatch')}
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
              placeholder={t('inventory.descriptionPlaceholder')}
            />

            {isEditing && (
              <div className='flex gap-4 pt-4 border-t'>
                <Button type='submit' isLoading={saving} disabled={saving}>
                  {t('common.save')}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
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

        {/* Stock Batches Section */}
        {item.batches && item.batches.length > 0 && (
          <Card className='mt-6'>
            <h3 className='text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('inventory.stockBatches')}
            </h3>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-neutral-200 dark:border-neutral-700'>
                    <th className='text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('inventory.batchNumber')}
                    </th>
                    <th className='text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('inventory.quantity')}
                    </th>
                    <th className='text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('inventory.expiryDate')}
                    </th>
                    <th className='text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('inventory.purchaseDate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.batches.map((batch, index) => (
                    <tr
                      key={batch._id || index}
                      className='border-b border-neutral-100 dark:border-neutral-800'
                    >
                      <td className='py-2 px-3 text-neutral-900 dark:text-neutral-100'>
                        {getDisplayValue(batch.batchNumber, effectiveLocale)}
                      </td>
                      <td className='py-2 px-3 text-neutral-900 dark:text-neutral-100'>
                        {getDisplayValue(String(batch.quantity), effectiveLocale)} {item.unit}
                      </td>
                      <td className='py-2 px-3 text-neutral-900 dark:text-neutral-100'>
                        {batch.expiryDate
                          ? new Date(batch.expiryDate).toLocaleDateString(effectiveLocale === 'ar' ? 'ar-SA' : effectiveLocale === 'es' ? 'es-ES' : undefined)
                          : t('common.na')}
                      </td>
                      <td className='py-2 px-3 text-neutral-900 dark:text-neutral-100'>
                        {batch.purchaseDate
                          ? new Date(batch.purchaseDate).toLocaleDateString(effectiveLocale === 'ar' ? 'ar-SA' : effectiveLocale === 'es' ? 'es-ES' : undefined)
                          : t('common.na')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Add Stock Modal */}
      <Modal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        title={t('inventory.addStock')}
      >
        <div className='space-y-4'>
          <Input
            label={t('inventory.batchNumber')}
            value={stockFormData.batchNumber}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, batchNumber: e.target.value })
            }
            placeholder={t('inventory.placeholderBatchExample')}
            required
          />

          <Input
            label={t('inventory.quantity')}
            type='number'
            value={stockFormData.quantity}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, quantity: e.target.value })
            }
            placeholder={t('inventory.enterQuantity')}
            min='1'
            required
          />

          <DatePicker
            label={t('inventory.expiryDate')}
            value={stockFormData.expiryDate}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, expiryDate: e.target.value })
            }
          />

          <DatePicker
            label={t('inventory.purchaseDate')}
            value={stockFormData.purchaseDate}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, purchaseDate: e.target.value })
            }
          />

          <Input
            label={t('inventory.costPrice')}
            type='number'
            step='0.01'
            value={stockFormData.costPrice}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, costPrice: e.target.value })
            }
            placeholder={t('inventory.enterCostPrice')}
          />

          <Input
            label={t('inventory.supplier')}
            value={stockFormData.supplier}
            onChange={(e) =>
              setStockFormData({ ...stockFormData, supplier: e.target.value })
            }
            placeholder={t('inventory.enterSupplierName')}
          />

          <div className='flex gap-4 pt-4'>
            <Button
              onClick={handleAddStock}
              isLoading={addingStock}
              disabled={addingStock}
            >
              {t('inventory.addStock')}
            </Button>
            <Button
              variant='secondary'
              onClick={() => setShowAddStockModal(false)}
              disabled={addingStock}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
