'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const localeCode = (settingsLocale || locale || 'en').toString().slice(0, 2);
  const unitPlaceholder =
    localeCode === 'ar'
      ? 'مثال: علبة، زجاجة، عبوة'
      : localeCode === 'es'
        ? 'ej., caja, frasco, paquete'
        : t('inventory.unitPlaceholder');

  useEffect(() => {
    if (!authLoading && user?.role === 'manager' && isManagerPathReadOnly(pathname)) {
      router.replace('/inventory');
    }
  }, [authLoading, user?.role, pathname, router]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    name_es: '',
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

  const generateNextCode = useCallback(async () => {
    try {
      const response = await apiClient.get('/inventory/items/next-code');
      if (response.success && response.data?.code) {
        setFormData((prev) => ({ ...prev, code: response.data.code }));
      }
    } catch (err) {
      // Fallback: generate code with timestamp if fetch fails
      const code = `MED-${Date.now().toString().slice(-4)}`;
      setFormData((prev) => ({ ...prev, code }));
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      generateNextCode();
    }
  }, [authLoading, user, generateNextCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        name_ar: formData.name_ar || undefined,
        name_es: formData.name_es || undefined,
        code: formData.code || undefined,
        type: formData.type,
        unit: formData.unit,
        description: formData.description || undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
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

  if (!user) return null;
  if (user.role === 'manager' && isManagerPathReadOnly(pathname)) return null;

  return (
    <Layout>
      <PageHeader
        title={t('inventory.addItem')}
        subtitle={t('inventory.items')}
        notifications={[]}
        unreadCount={0}
      />
      <div style={{ padding: '0 10px' }}>
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
                  placeholder={t('inventory.itemNamePlaceholder')}
                />
              </div>

              <div>
                <Input
                  label={t('inventory.itemNameArabic')}
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder={t('inventory.itemNamePlaceholder')}
                />
              </div>

              <div>
                <Input
                  label={t('inventory.itemNameSpanish')}
                  value={formData.name_es}
                  onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                  placeholder={t('inventory.itemNamePlaceholder')}
                />
              </div>

              <div>
                <Input
                  label={`${t('inventory.code')} ${t('inventory.autoGenerated')}`}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder={t('inventory.codePlaceholder')}
                />
                <p className='text-sm text-neutral-500 mt-1'>
                  {t('inventory.autoGeneratedHint')}
                </p>
              </div>

              <Select
                label={t('inventory.category')}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                options={[
                  { value: 'medicine', label: t('inventory.medicine') },
                  { value: 'equipment', label: t('inventory.equipment') },
                  { value: 'supply', label: t('inventory.supply') },
                  { value: 'consumable', label: t('inventory.consumable') },
                  { value: 'other', label: t('common.other') },
                ]}
              />

              <div>
                <Input
                  label={t('inventory.unit') + ' *'}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  placeholder={unitPlaceholder}
                />
              </div>

              <div>
                <Input
                  label={t('inventory.costPrice')}
                  type='number'
                  step='0.01'
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder={t('inventory.pricePlaceholder')}
                />
                <p className='text-sm text-neutral-500 mt-1'>{t('inventory.costPriceHint')}</p>
              </div>

              <div>
                <Input
                  label={t('inventory.sellingPrice') + ' *'}
                  type='number'
                  step='0.01'
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder={t('inventory.pricePlaceholder')}
                  required
                />
                <p className='text-sm text-neutral-500 mt-1'>{t('inventory.sellingPriceHint')}</p>
              </div>

              <div>
                <Input
                  label={t('inventory.currentStock') + ' *'}
                  type='number'
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  required
                  placeholder={t('inventory.quantityPlaceholder')}
                />
                <p className='text-sm text-neutral-500 mt-1'>{t('inventory.initialStockHint')}</p>
              </div>

              <div>
                <Input
                  label={t('inventory.lowStockThreshold') + ' *'}
                  type='number'
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  required
                  placeholder={t('inventory.minStockPlaceholder')}
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
                  placeholder={t('inventory.batchPlaceholder')}
                />
              </div>

              <div>
                <Input
                  label={t('inventory.supplier')}
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder={t('inventory.supplierPlaceholder')}
                />
              </div>

              <div className='md:col-span-2'>
                <Textarea
                  label={t('inventory.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder={t('inventory.descriptionPlaceholder')}
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
