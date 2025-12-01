'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';

interface InventoryItem {
  _id: string;
  name: string;
  code?: string;
  type: string;
  totalQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  costPrice?: number;
  sellingPrice?: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    }
  }, [authLoading, user, showLowStock]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showLowStock) {
        // Filter will be handled on backend, but we can add a note here
      }

      const response = await apiClient.get<InventoryItem[]>(`/inventory/items?${params}`);
      if (response.success && response.data) {
        let filteredItems = Array.isArray(response.data) ? response.data : [];
        if (showLowStock) {
          filteredItems = filteredItems.filter(
            (item) => item.totalQuantity <= item.lowStockThreshold
          );
        }
        setItems(filteredItems);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const columns = [
    { header: t('inventory.itemName'), accessor: 'name' as keyof InventoryItem },
    { header: 'Code', accessor: 'code' as keyof InventoryItem },
    { header: t('inventory.category'), accessor: 'type' as keyof InventoryItem },
    {
      header: t('inventory.currentStock'),
      accessor: (row: InventoryItem) => (
        <span
          className={
            row.totalQuantity <= row.lowStockThreshold
              ? 'text-red-600 font-medium'
              : 'text-gray-900'
          }
        >
          {row.totalQuantity} / {row.availableQuantity} available
        </span>
      ),
    },
    {
      header: t('inventory.price'),
      accessor: (row: InventoryItem) => formatCurrency(row.costPrice),
    },
    {
      header: t('inventory.price'),
      accessor: (row: InventoryItem) => formatCurrency(row.sellingPrice),
    },
  ];

  if (authLoading || loading) {
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('inventory.title')}</h1>
          <p className="text-gray-600 mt-2">{t('inventory.items')}</p>
        </div>
        <Button onClick={() => router.push('/inventory/items/new')}>+ {t('inventory.addItem')}</Button>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('inventory.lowStock')}</span>
          </label>
        </div>
      </Card>

      <Card>
        <Table
          data={items}
          columns={columns}
          onRowClick={(row) => router.push(`/inventory/items/${row._id}`)}
          emptyMessage={t('common.noDataFound')}
        />
      </Card>
    </Layout>
  );
}

