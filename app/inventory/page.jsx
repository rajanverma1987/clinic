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

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
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

      const response = await apiClient.get(`/inventory/items?${params}`);
      if (response.success && response.data) {
        // Handle pagination structure - data might be inside response.data.data
        let itemsList = [];
        if (Array.isArray(response.data)) {
          itemsList = response.data;
        } else if (response.data?.data) {
          itemsList = response.data.data;
        }
        
        if (showLowStock) {
          itemsList = itemsList.filter(
            (item) => item.totalQuantity <= item.lowStockThreshold
          );
        }
        setItems(itemsList);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const columns = [
    { header: t('inventory.itemName'), accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    { header: t('inventory.category'), accessor: 'type' },
    {
      header: t('inventory.currentStock'),
      accessor: (row) => (
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
      accessor: (row) => formatCurrency(row.costPrice),
    },
    {
      header: t('inventory.price'),
      accessor: (row) => formatCurrency(row.sellingPrice),
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

