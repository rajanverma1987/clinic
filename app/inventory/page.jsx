'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
          itemsList = itemsList.filter((item) => item.totalQuantity <= item.lowStockThreshold);
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
              ? 'text-status-error font-medium'
              : 'text-neutral-900'
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
    return (
      <Layout>
        <Loader size='md' className='h-64' />
      </Layout>
    );
  }

  return (
    <Layout>
      <DashboardHeader
        title={t('inventory.title')}
        subtitle={t('inventory.items')}
        actionButton={
          <Button
            onClick={() => router.push('/inventory/items/new')}
            variant='primary'
            size='md'
            className='whitespace-nowrap'
          >
            + {t('inventory.addItem')}
          </Button>
        }
      />

      <Card className='mb-6'>
        <div className='flex items-center gap-4'>
          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className='mr-2'
            />
            <span className='text-sm text-neutral-700'>{t('inventory.lowStock')}</span>
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
