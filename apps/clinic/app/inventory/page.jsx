'use client';

import { EyeIcon, FileDownIcon, TrashIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const ROUTE_KEY = 'route_inventory';

const INVENTORY_TAB_IDS = ['items', 'lots', 'suppliers', 'transactions'];

export default function InventoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const tenantId = user?.tenantId ?? null;
  const localeCode = (i18nLocale || settingsLocale || 'en').toString().slice(0, 2);
  const dateLocale =
    localeCode === 'ar' ? 'ar' : localeCode === 'es' ? 'es' : (i18nLocale || 'en-US');
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
    { value: 'all', label: t('inventory.filterAll') },
    { value: 'medicine', label: t('inventory.medicine') },
    { value: 'medical_supply', label: t('inventory.medicalSupply') },
    { value: 'equipment', label: t('inventory.equipment') },
    { value: 'consumable', label: t('inventory.consumable') },
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

  const [deleteItemModal, setDeleteItemModal] = useState({ open: false, item: null });
  const [deleteBatchModal, setDeleteBatchModal] = useState({ open: false, lot: null });
  const [deleting, setDeleting] = useState(false);

  const normalizeItemNames = useCallback((list) =>
    (list || []).map((item) => ({
      ...item,
      name_ar: item.name_ar ?? item.name ?? '',
      name_es: item.name_es ?? item.name ?? '',
    })), []);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.items != null) {
      setItems(normalizeItemNames(cached.items));
      setLoading(false);
    }
  }, [tenantId, normalizeItemNames]);

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
          const raw = extractArrayData(response);
          const itemsList = normalizeItemNames(raw);
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
    [tenantId, showLowStock, debouncedSearchTerm, categoryFilter, normalizeItemNames],
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    }
  }, [authLoading, user, showLowStock, fetchItems]);

  const fetchItemsRef = useRef(fetchItems);
  fetchItemsRef.current = fetchItems;
  const prevLocaleRef = useRef(localeCode);
  // When locale changes (e.g. user switches to Arabic/Spanish), clear cache and refetch for correct name_ar/name_es
  useEffect(() => {
    if (!tenantId || !user || prevLocaleRef.current === localeCode) return;
    prevLocaleRef.current = localeCode;
    routeCache.clear(ROUTE_KEY, tenantId);
    fetchItemsRef.current(true);
  }, [localeCode, tenantId, user]);

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

  const handleOpenSearch = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSearch'));
    }
  }, []);

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
      const getCategoryLabel = (type) => {
        const key =
          {
            medicine: 'inventory.medicine',
            medical_supply: 'inventory.medicalSupply',
            equipment: 'inventory.equipment',
            consumable: 'inventory.consumable',
            supply: 'inventory.supply',
            other: 'common.other',
          }[type] || 'common.other';
        return t(key);
      };
      const getExportItemName = (r) =>
        localeCode === 'ar' ? (r?.name_ar ?? r?.name ?? '') : localeCode === 'es' ? (r?.name_es ?? r?.name ?? '') : (r?.name ?? '');
      const rows = list.map((r) => [
        getExportItemName(r),
        r.code || '',
        getCategoryLabel(r.type),
        `${r.availableQuantity ?? 0} / ${r.totalQuantity ?? 0} ${t('inventory.available')}`,
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
  }, [showLowStock, debouncedSearchTerm, categoryFilter, t, localeCode]);

  const formatCurrency = useCallback(
    (amount) => {
      if (!amount) return 'N/A';
      return new Intl.NumberFormat(dateLocale, {
        style: 'currency',
        currency: 'USD',
      }).format(amount / 100);
    },
    [dateLocale],
  );

  const getTypeLabel = useCallback(
    (type) => {
      const key =
        {
          medicine: 'inventory.medicine',
          medical_supply: 'inventory.medicalSupply',
          equipment: 'inventory.equipment',
          consumable: 'inventory.consumable',
          supply: 'inventory.supply',
          other: 'common.other',
        }[type] || 'common.other';
      return t(key);
    },
    [t],
  );

  /** Item name by current locale (name_ar / name_es / name) for table and CSV */
  const getItemDisplayName = useCallback(
    (row) => {
      if (localeCode === 'ar') return (row?.name_ar ?? row?.name) || '';
      if (localeCode === 'es') return (row?.name_es ?? row?.name) || '';
      return (row?.name ?? '') || '';
    },
    [localeCode],
  );

  /** Lot item name by locale (lots API returns itemName, itemName_ar, itemName_es) */
  const getLotItemDisplayName = useCallback(
    (lot) => {
      if (localeCode === 'ar') return (lot?.itemName_ar ?? lot?.itemName) || '';
      if (localeCode === 'es') return (lot?.itemName_es ?? lot?.itemName) || '';
      return (lot?.itemName ?? '') || '';
    },
    [localeCode],
  );

  /** Lot batch number by locale (lots API returns batchNumber, batchNumber_ar, batchNumber_es) */
  const getLotBatchDisplayName = useCallback(
    (lot) => {
      if (localeCode === 'ar') return (lot?.batchNumber_ar ?? lot?.batchNumber) || '';
      if (localeCode === 'es') return (lot?.batchNumber_es ?? lot?.batchNumber) || '';
      return (lot?.batchNumber ?? '') || '';
    },
    [localeCode],
  );

  /** Lot quantity + unit by locale (lots API returns unit, unit_ar, unit_es) */
  const getLotQuantityDisplay = useCallback(
    (lot) => {
      const qty = lot?.quantity ?? 0;
      const unit =
        localeCode === 'ar'
          ? (lot?.unit_ar ?? lot?.unit) || ''
          : localeCode === 'es'
            ? (lot?.unit_es ?? lot?.unit) || ''
            : (lot?.unit ?? '') || '';
      return unit ? `${qty} ${unit}` : String(qty);
    },
    [localeCode],
  );

  /** Transaction item name by locale */
  const getTxItemDisplayName = useCallback(
    (tx) => {
      if (localeCode === 'ar') return (tx?.itemName_ar ?? tx?.itemName) || '';
      if (localeCode === 'es') return (tx?.itemName_es ?? tx?.itemName) || '';
      return (tx?.itemName ?? '') || '';
    },
    [localeCode],
  );

  const handleDeleteItem = async () => {
    if (!deleteItemModal.item) return;
    setDeleting(true);
    try {
      const response = await apiClient.delete(`/inventory/items/${deleteItemModal.item._id}`);
      if (response.success) {
        showSuccess(t('inventory.itemDeleted'));
        setDeleteItemModal({ open: false, item: null });
        fetchItems();
      } else {
        showError(response.error?.message || t('inventory.deleteItemFailed'));
      }
    } catch (err) {
      logger.error('Failed to delete inventory item:', err);
      showError(err.message || t('inventory.deleteItemFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchModal.lot) return;
    setDeleting(true);
    try {
      const { itemId, batchNumber } = deleteBatchModal.lot;
      const response = await apiClient.delete(
        `/inventory/items/${itemId}/batch?batchNumber=${encodeURIComponent(batchNumber)}`
      );
      if (response.success) {
        showSuccess(t('inventory.batchDeleted'));
        setDeleteBatchModal({ open: false, lot: null });
        fetchLots();
      } else {
        showError(response.error?.message || t('inventory.deleteBatchFailed'));
      }
    } catch (err) {
      logger.error('Failed to delete batch:', err);
      showError(err.message || t('inventory.deleteBatchFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      { header: () => t('inventory.itemName'), accessor: (row) => getItemDisplayName(row) },
      { header: () => t('inventory.code'), accessor: 'code' },
      {
        header: () => t('inventory.category'),
        accessor: (row) => getTypeLabel(row.type),
      },
      {
        header: () => t('inventory.currentStock'),
        accessor: (row) => {
          const available = row.availableQuantity ?? 0;
          const threshold = row.lowStockThreshold ?? 0;
          const isLow = available <= threshold;
          return (
            <span className={isLow ? 'text-status-error font-medium' : 'text-neutral-900'}>
              {row.availableQuantity} / {row.totalQuantity} {t('inventory.available')}
            </span>
          );
        },
      },
      {
        header: () => t('inventory.costPrice'),
        accessor: (row) => formatCurrency(row.costPrice),
      },
      {
        header: () => t('inventory.sellingPrice'),
        accessor: (row) => formatCurrency(row.sellingPrice),
      },
      {
        header: () => t('common.actions'),
        accessor: (row) => (
          <ActionsMenu
            ariaLabel={t('common.actions')}
            triggerSize='xs'
            items={[
              {
                key: 'view',
                label: t('inventory.viewItem'),
                icon: <EyeIcon className='icon icon-sm' />,
                onClick: () => router.push(`/inventory/items/${row._id}`),
              },
              ...((!(user?.role === 'manager' && managerReadOnly))
                ? [
                    {
                      key: 'delete',
                      label: t('common.delete'),
                      icon: <TrashIcon className='icon icon-sm' />,
                      onClick: () => setDeleteItemModal({ open: true, item: row }),
                      variant: 'danger',
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    [t, getTypeLabel, getItemDisplayName, formatCurrency, router, user?.role, managerReadOnly, localeCode],
  );

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

  const formatLotsDate = useCallback(
    (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    [dateLocale],
  );

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
        onOpenSearch={handleOpenSearch}
        onRefresh={activeTab === 'items' ? handleManualRefresh : undefined}
        refreshing={activeTab === 'items' && refreshing}
        actionButton={
          activeTab === 'items' && !(user?.role === 'manager' && managerReadOnly) ? (
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
                    {!(user?.role === 'manager' && managerReadOnly) && (
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
                        <span className='ml-1.5'>{t('inventory.exportCSV')}</span>
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
                      key={localeCode}
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
                                <div className='font-medium'>{getLotItemDisplayName(lot)}</div>
                                {lot.itemCode && (
                                  <div className='text-xs text-neutral-500'>{lot.itemCode}</div>
                                )}
                              </div>
                            </td>
                            <td className='font-mono'>{getLotBatchDisplayName(lot)}</td>
                            <td>{getLotQuantityDisplay(lot)}</td>
                            <td>{formatLotsDate(lot.expiryDate)}</td>
                            <td className='text-neutral-600'>{lot.supplierName || t('common.na')}</td>
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
                                  ...((!(user?.role === 'manager' && managerReadOnly))
                                    ? [
                                        {
                                          key: 'delete',
                                          label: t('inventory.deleteBatch'),
                                          icon: <TrashIcon className='icon icon-sm' />,
                                          onClick: () =>
                                            setDeleteBatchModal({
                                              open: true,
                                              lot: lot,
                                            }),
                                          variant: 'danger',
                                        },
                                      ]
                                    : []),
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
                                  {getTxItemDisplayName(tx) || t('common.unknown')}
                                </div>
                                {tx.itemCode && (
                                  <div className='text-xs text-neutral-500'>{tx.itemCode}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className='capitalize'>
                                {t(
                                  `inventory.${
                                    {
                                      in: 'typeIn',
                                      IN: 'typeIn',
                                      out: 'typeOut',
                                      OUT: 'typeOut',
                                      adjustment: 'typeAdjustment',
                                      ADJUSTMENT: 'typeAdjustment',
                                    }[tx.type] || 'typeIn'
                                  }`
                                )}
                              </span>
                            </td>
                            <td>{tx.quantity}</td>
                            <td>
                              <span className='capitalize'>
                                {t(
                                  `inventory.${
                                    {
                                      completed: 'statusCompleted',
                                      COMPLETED: 'statusCompleted',
                                      pending: 'statusPending',
                                      PENDING: 'statusPending',
                                      failed: 'statusFailed',
                                      FAILED: 'statusFailed',
                                      cancelled: 'statusCancelled',
                                      CANCELLED: 'statusCancelled',
                                    }[tx.status] || 'statusPending'
                                  }`
                                )}
                              </span>
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

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={deleteItemModal.open}
        onClose={() => setDeleteItemModal({ open: false, item: null })}
        title={t('inventory.deleteItem')}
      >
        <div className='space-y-4'>
          <p className='text-neutral-700 dark:text-neutral-300'>
            {t('inventory.confirmDeleteItem')}
          </p>
          {deleteItemModal.item && (
            <p className='font-medium text-neutral-900 dark:text-neutral-100'>
              {deleteItemModal.item.name}
            </p>
          )}
          <div className='flex gap-4 pt-4'>
            <Button
              variant='danger'
              onClick={handleDeleteItem}
              isLoading={deleting}
              disabled={deleting}
            >
              {t('common.delete')}
            </Button>
            <Button
              variant='secondary'
              onClick={() => setDeleteItemModal({ open: false, item: null })}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Batch Confirmation Modal */}
      <Modal
        isOpen={deleteBatchModal.open}
        onClose={() => setDeleteBatchModal({ open: false, lot: null })}
        title={t('inventory.deleteBatch')}
      >
        <div className='space-y-4'>
          <p className='text-neutral-700 dark:text-neutral-300'>
            {t('inventory.confirmDeleteBatch')}
          </p>
          {deleteBatchModal.lot && (
            <div className='bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg'>
              <p className='font-medium text-neutral-900 dark:text-neutral-100'>
                {getLotItemDisplayName(deleteBatchModal.lot)}
              </p>
              <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                {t('inventory.batchNumber')}: {getLotBatchDisplayName(deleteBatchModal.lot)}
              </p>
              <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                {t('inventory.quantity')}: {getLotQuantityDisplay(deleteBatchModal.lot)}
              </p>
            </div>
          )}
          <div className='flex gap-4 pt-4'>
            <Button
              variant='danger'
              onClick={handleDeleteBatch}
              isLoading={deleting}
              disabled={deleting}
            >
              {t('inventory.deleteBatch')}
            </Button>
            <Button
              variant='secondary'
              onClick={() => setDeleteBatchModal({ open: false, lot: null })}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
