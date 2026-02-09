'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const ROUTE_KEY = 'route_inventory';

export default function InventoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const tenantId = user?.tenantId ?? null;
  const managerReadOnly = isManagerPathReadOnly(pathname);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.items != null) {
      setItems(cached.items);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchItems = useCallback(async () => {
    const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
    if (!hasCache) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showLowStock) params.set('lowStock', 'true');
      const response = await apiClient.get(`/inventory/items?${params}`);
      if (response.success && response.data) {
        const itemsList = extractArrayData(response);
        if (!showLowStock && tenantId) routeCache.set(ROUTE_KEY, tenantId, { items: itemsList });
        setItems(itemsList);
      }
    } catch (error) {
      logger.error('Failed to fetch inventory items', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, showLowStock]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    }
  }, [authLoading, user, showLowStock, fetchItems]);

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const columns = [
    { header: t('inventory.itemName'), accessor: 'name' },
    { header: t('inventory.code'), accessor: 'code' },
    { header: t('inventory.category'), accessor: 'type' },
    {
      header: t('inventory.currentStock'),
      accessor: (row) => {
        const available = row.availableQuantity ?? 0;
        const threshold = row.lowStockThreshold ?? 0;
        const isLow = available <= threshold;
        return (
          <span className={isLow ? 'text-status-error font-medium' : 'text-neutral-900'}>
            {row.totalQuantity} / {row.availableQuantity} available
          </span>
        );
      },
    },
    {
      header: t('inventory.costPrice'),
      accessor: (row) => formatCurrency(row.costPrice),
    },
    {
      header: t('inventory.sellingPrice'),
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
    return <Loader type='page' text={t('common.loading')} />;
  }

  return (
    <Layout>
      <PageHeader
        title={t('inventory.title')}
        subtitle={t('inventory.items')}
        notifications={[]}
        unreadCount={0}
        actionButton={
          managerReadOnly ? null : (
            <Button
              href='/inventory/items/new'
              variant='primary'
              size='md'
              className='whitespace-nowrap'
            >
              + {t('inventory.addItem')}
            </Button>
          )
        }
      />
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='flex items-center gap-4'>
            <div
              role='button'
              tabIndex={0}
              className='flex items-center gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLowStock((prev) => !prev);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowLowStock((prev) => !prev);
                }
              }}
            >
              <span className='pointer-events-none' aria-hidden>
                <Checkbox
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  size='sm'
                />
              </span>
              <span className='text-sm text-neutral-700'>{t('inventory.lowStock')}</span>
            </div>
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
      </div>
    </Layout>
  );
}
