'use client';

import { EyeIcon, FileDownIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader } from '@/components/ui/Loader';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { Table } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { Tabs, getTabPanelId, getTabPanelLabelledBy } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ROUTE_KEY = 'route_inventory';

const INVENTORY_TAB_IDS = ['items', 'lots', 'suppliers', 'transactions'];

export default function InventoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { locale } = useSettings();
  const tenantId = user?.tenantId ?? null;
  const managerReadOnly = isManagerPathReadOnly(pathname);

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && INVENTORY_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : 'items',
  );

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

  const [lots, setLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotsFilter, setLotsFilter] = useState('all');

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.items != null) {
      setItems(cached.items);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchItems = useCallback(
    async (silentRefresh = false) => {
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
    },
    [tenantId, showLowStock, debouncedSearchTerm, categoryFilter],
  );

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
    const t = searchParams.get('tab');
    if (t && INVENTORY_TAB_IDS.includes(t)) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchLots = useCallback(async () => {
    try {
      setLotsLoading(true);
      const params = new URLSearchParams();
      if (lotsFilter === 'expiringSoon') params.append('expiringSoon', 'true');
      else if (lotsFilter === 'expired') params.append('expired', 'true');
      const response = await apiClient.get(`/inventory/lots?${params.toString()}`);
      if (response.success) setLots(response.data || []);
      else setLots([]);
    } catch (error) {
      logger.error('Failed to fetch lots:', error);
      setLots([]);
    } finally {
      setLotsLoading(false);
    }
  }, [lotsFilter]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (activeTab === 'lots') fetchLots();
  }, [authLoading, user, activeTab, fetchLots]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setSuppliersLoading(true);
      const response = await apiClient.get('/inventory/suppliers');
      if (response.success) setSuppliers(extractArrayData(response));
      else setSuppliers([]);
    } catch (error) {
      logger.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const response = await apiClient.get('/inventory/transactions');
      if (response.success) setTransactions(extractArrayData(response));
      else setTransactions([]);
    } catch (error) {
      logger.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    if (activeTab === 'suppliers') fetchSuppliers();
  }, [authLoading, user, activeTab, fetchSuppliers]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (activeTab === 'transactions') fetchTransactions();
  }, [authLoading, user, activeTab, fetchTransactions]);

  const formatLotsDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(locale || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLotStatusBadge = (lot) => {
    if (lot.isExpired) {
      return (
        <span className='px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200'>
          {t('inventory.expired')}
        </span>
      );
    }
    if (lot.isExpiringSoon) {
      return (
        <span className='px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-amber-900/60 dark:text-amber-200'>
          {t('inventory.expiringSoon')} ({lot.daysUntilExpiry} {t('common.days')})
        </span>
      );
    }
    return (
      <span className='px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'>
        {t('common.active')}
      </span>
    );
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

  const expiringSoonCount = lots.filter((l) => l.isExpiringSoon && !l.isExpired).length;
  const expiredCount = lots.filter((l) => l.isExpired).length;

  return (
    <Layout>
      <PageHeader
        title={t('inventory.title')}
        subtitle={
          activeTab === 'items'
            ? t('inventory.items')
            : activeTab === 'lots'
              ? t('nav.lots')
              : activeTab === 'suppliers'
                ? t('inventory.suppliers')
                : t('inventory.transactions')
        }
        notifications={[]}
        unreadCount={0}
        onRefresh={activeTab === 'items' ? handleManualRefresh : undefined}
        refreshing={activeTab === 'items' && refreshing}
        actionButton={
          activeTab === 'items' && !managerReadOnly ? (
            <Button
              href='/inventory/items/new'
              variant='primary'
              size='md'
              className='whitespace-nowrap'
            >
              + {t('inventory.addItem')}
            </Button>
          ) : null
        }
      />
      <div style={{ padding: '0 10px' }} className='data-tabs-container'>
        <Tabs
          tabs={[
            { id: 'items', label: t('inventory.items') },
            { id: 'lots', label: t('nav.lots') },
            { id: 'suppliers', label: t('inventory.suppliers') },
            { id: 'transactions', label: t('inventory.transactions') },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          idPrefix='inventory-tabs'
          ariaLabel={t('inventory.title')}
        />
        <div
          role='tabpanel'
          id={getTabPanelId('inventory-tabs', activeTab)}
          aria-labelledby={getTabPanelLabelledBy('inventory-tabs', activeTab)}
          className='mt-4'
        >
          {activeTab === 'items' && (
            <>
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
            </>
          )}

          {activeTab === 'lots' && (
            <div className='space-y-4'>
              <Tabs
                variant='pills'
                tabs={[
                  { id: 'all', label: t('inventory.allLots'), count: lots.length },
                  {
                    id: 'expiringSoon',
                    label: t('inventory.expiringSoon'),
                    count: expiringSoonCount,
                  },
                  { id: 'expired', label: t('inventory.expired'), count: expiredCount },
                ]}
                activeTab={lotsFilter}
                onChange={setLotsFilter}
                idPrefix='inventory-lots-subtabs'
                ariaLabel={t('inventory.inventoryLots')}
              />
              {lotsLoading ? (
                <Card>
                  <TableSkeleton rows={8} cols={7} />
                </Card>
              ) : lots.length === 0 ? (
                <Card>
                  <div className='p-8 text-center'>
                    <p className='text-neutral-600'>{t('inventory.noLotsFound')}</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('inventory.itemName')}</th>
                          <th>{t('inventory.batchNumber')}</th>
                          <th>{t('inventory.quantity')}</th>
                          <th>{t('inventory.expiryDate')}</th>
                          <th>{t('inventory.supplier')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lots.map((lot) => (
                          <tr key={lot._id}>
                            <td>
                              <div>
                                <div className='font-medium'>{lot.itemName}</div>
                                {lot.itemCode && (
                                  <div className='text-xs text-neutral-500'>{lot.itemCode}</div>
                                )}
                              </div>
                            </td>
                            <td className='font-mono'>{lot.batchNumber}</td>
                            <td>
                              {lot.quantity} {lot.unit}
                            </td>
                            <td>{formatLotsDate(lot.expiryDate)}</td>
                            <td className='text-neutral-600'>{lot.supplierName || 'N/A'}</td>
                            <td>{getLotStatusBadge(lot)}</td>
                            <td>
                              <ActionsMenu
                                ariaLabel={t('common.actions')}
                                triggerSize='xs'
                                items={[
                                  {
                                    key: 'view',
                                    label: t('inventory.viewItem'),
                                    icon: <EyeIcon className='icon icon-sm' />,
                                    onClick: () => router.push(`/inventory/items/${lot.itemId}`),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <>
              {suppliersLoading ? (
                <Card>
                  <TableSkeleton rows={8} cols={5} />
                </Card>
              ) : suppliers.length === 0 ? (
                <Card>
                  <div className='p-8 text-center'>
                    <p className='text-neutral-600'>{t('inventory.noSuppliersFound')}</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('inventory.supplierName')}</th>
                          <th>{t('inventory.code')}</th>
                          <th>{t('inventory.contactPerson')}</th>
                          <th>{t('common.email')}</th>
                          <th>{t('common.phone')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map((s) => (
                          <tr key={s._id}>
                            <td className='font-medium'>{s.name}</td>
                            <td className='font-mono text-neutral-600'>{s.code || '—'}</td>
                            <td className='text-neutral-600'>{s.contactPerson || '—'}</td>
                            <td className='text-neutral-600'>{s.email || '—'}</td>
                            <td className='text-neutral-600'>{s.phone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              {transactionsLoading ? (
                <Card>
                  <TableSkeleton rows={8} cols={6} />
                </Card>
              ) : transactions.length === 0 ? (
                <Card>
                  <div className='p-8 text-center'>
                    <p className='text-neutral-600'>{t('inventory.noTransactionsFound')}</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('inventory.transactionNumber')}</th>
                          <th>{t('inventory.itemName')}</th>
                          <th>{t('inventory.transactionType')}</th>
                          <th>{t('inventory.quantity')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('common.date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx._id}>
                            <td className='font-mono'>{tx.transactionNumber || tx._id}</td>
                            <td>
                              <div>
                                <div className='font-medium'>
                                  {tx.itemName || t('common.unknown')}
                                </div>
                                {tx.itemCode && (
                                  <div className='text-xs text-neutral-500'>{tx.itemCode}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className='capitalize'>{tx.type}</span>
                            </td>
                            <td>{tx.quantity}</td>
                            <td>
                              <span className='capitalize'>{tx.status}</span>
                            </td>
                            <td>{formatLotsDate(tx.createdAt || tx.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
