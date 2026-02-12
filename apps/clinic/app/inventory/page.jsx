'use client';

import { FileDownIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';

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
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  const CATEGORIES = [
    { value: 'all', label: t('inventory.filterAll') || 'All' },
    { value: 'medicine', label: t('inventory.medicine') || 'Medicine' },
    { value: 'medical_supply', label: t('inventory.medicalSupply') || 'Medical Supply' },
    { value: 'equipment', label: t('inventory.equipment') || 'Equipment' },
    { value: 'consumable', label: t('inventory.consumable') || 'Consumable' },
    { value: 'other', label: t('common.other') },
  ];
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.items != null) {
      setItems(cached.items);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchItems = useCallback(async (silentRefresh = false) => {
    const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
    if (!silentRefresh && !hasCache) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showLowStock) params.set('lowStock', 'true');
      if (debouncedSearchTerm?.trim()) params.set('search', debouncedSearchTerm.trim());
      if (categoryFilter && categoryFilter !== 'all') params.set('type', categoryFilter);
      const response = await apiClient.get(`/inventory/items?${params}`);
      if (response.success && response.data) {
        const itemsList = extractArrayData(response);
        if (!showLowStock && tenantId) routeCache.set(ROUTE_KEY, tenantId, { items: itemsList });
        setItems(itemsList);
      }
    } catch (error) {
      logger.error('Failed to fetch inventory items', error);
    } finally {
      if (!silentRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, showLowStock, debouncedSearchTerm, categoryFilter]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    }
  }, [authLoading, user, showLowStock, fetchItems]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && user && !showLowStock) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchItems(true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, showLowStock, fetchItems]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(false);
  }, [fetchItems]);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ limit: '10000' });
      if (showLowStock) params.set('lowStock', 'true');
      if (debouncedSearchTerm?.trim()) params.set('search', debouncedSearchTerm.trim());
      if (categoryFilter && categoryFilter !== 'all') params.set('type', categoryFilter);
      const res = await apiClient.get(`/inventory/items?${params}`);
      const list = extractArrayData(res) || [];
      if (!list.length) {
        showError(t('inventory.noItemsToExport'));
        return;
      }
      const headers = [
        t('inventory.itemName'),
        t('inventory.code'),
        t('inventory.category'),
        t('inventory.currentStock'),
        t('inventory.costPrice'),
        t('inventory.sellingPrice'),
      ];
      const rows = list.map((r) => [
        r.name || '',
        r.code || '',
        r.type || '',
        `${r.totalQuantity ?? 0} / ${r.availableQuantity ?? 0}`,
        r.costPrice != null ? String(r.costPrice / 100) : '',
        r.sellingPrice != null ? String(r.sellingPrice / 100) : '',
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('inventory.exportSuccess'));
    } catch (err) {
      logger.error('Inventory export failed', err);
      showError(t('inventory.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [showLowStock, debouncedSearchTerm, categoryFilter, t]);

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

  return (
    <Layout>
      <PageHeader
        title={t('inventory.title')}
        subtitle={t('inventory.items')}
        notifications={[]}
        unreadCount={0}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
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
        {loading ? (
          <Card>
            <TableSkeleton rows={10} cols={6} />
          </Card>
        ) : (
          <>
            <PageSearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={() => {}}
              placeholder={t('inventory.searchPlaceholder')}
            >
              <select
                className='filter-select rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-primary-500'
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label={t('inventory.category')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {!managerReadOnly && (
                <Button
                  variant='ghost'
                  size='md'
                  onClick={handleExportCsv}
                  disabled={exporting}
                  className='rounded-lg border border-neutral-200 dark:border-neutral-600'
                >
                  {exporting ? (
                    <Loader size='sm' className='animate-spin' aria-hidden />
                  ) : (
                    <FileDownIcon className='icon icon-sm' aria-hidden />
                  )}
                  <span className='ml-1.5'>{t('common.exportCSV')}</span>
                </Button>
              )}
            </PageSearchBar>
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
          </>
        )}
      </div>
    </Layout>
  );
}
