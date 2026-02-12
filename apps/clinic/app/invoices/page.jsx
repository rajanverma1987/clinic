'use client';

import {
  EyeIcon,
  FileDownIcon,
  PencilIcon,
  PrinterIcon,
  TrashIcon,
} from '@/components/icons';
import { InvoicePrintPreview } from '@/components/invoices/InvoicePrintPreview';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ROUTE_KEY = 'route_invoices';

export default function InvoicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { open: openConfirm } = useConfirmation();
  const { t } = useI18n();

  const PAYMENT_METHODS = [
    { value: 'cash', label: t('invoices.cash') },
    { value: 'card', label: t('invoices.card') },
    { value: 'upi', label: t('invoices.upi') },
    { value: 'bank_transfer', label: t('invoices.bankTransfer') },
    { value: 'cheque', label: t('invoices.cheque') },
    { value: 'insurance', label: t('invoices.insurance') },
    { value: 'other', label: t('common.other') },
  ];
  const { currency, locale } = useSettings();
  const tenantId = user?.tenantId ?? null;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printInvoiceId, setPrintInvoiceId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Hydrate from localStorage before paint (no flash, no hydration mismatch)
  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached?.invoices != null) {
      setInvoices(cached.invoices);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchInvoices = useCallback(
    async (silentRefresh = false) => {
      const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
      if (!silentRefresh && !hasCache) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') {
          if (statusFilter === 'overdue') {
            params.append('status', 'pending');
          } else {
            params.append('status', statusFilter);
          }
        }
        if (searchTerm?.trim()) params.append('search', searchTerm.trim());
        if (startDate) params.append('startDate', new Date(startDate).toISOString());
        if (endDate) params.append('endDate', new Date(endDate + 'T23:59:59.999Z').toISOString());
        const response = await apiClient.get(`/invoices?${params}`);
        if (response.success && response.data) {
          let invoicesList = extractArrayData(response);
          if (statusFilter === 'overdue') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            invoicesList = invoicesList.filter(
              (inv) => inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < today,
            );
          }
          setInvoices(invoicesList);
          if (tenantId) routeCache.set(ROUTE_KEY, tenantId, { invoices: invoicesList });
        } else {
          setInvoices([]);
        }
      } catch (error) {
        logger.error('Failed to fetch invoices', error);
        setInvoices([]);
      } finally {
        if (!silentRefresh) setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantId, statusFilter, searchTerm, startDate, endDate],
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchInvoices();
    }
  }, [authLoading, user, fetchInvoices]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && user && statusFilter === 'all' && !startDate && !endDate) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchInvoices(true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, statusFilter, startDate, endDate, fetchInvoices]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvoices(false);
  }, [fetchInvoices]);

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      paid: t('invoices.paid'),
      pending: t('invoices.pending'),
      partial: t('invoices.partial') || 'Partial',
      overdue: t('invoices.overdue'),
      draft: t('invoices.draft') || 'Draft',
    };
    return statusMap[status] || status;
  };

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ limit: '10000' });
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'overdue') params.append('status', 'pending');
        else params.append('status', statusFilter);
      }
      if (searchTerm?.trim()) params.append('search', searchTerm.trim());
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate + 'T23:59:59.999Z').toISOString());
      const res = await apiClient.get(`/invoices?${params}`);
      let list = extractArrayData(res) || [];
      if (statusFilter === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        list = list.filter(
          (inv) => inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < today,
        );
      }
      if (!list.length) {
        showError(t('invoices.noInvoicesToExport'));
        return;
      }
      const headers = [
        t('invoices.invoiceHash'),
        t('appointments.patient'),
        t('invoices.status'),
        t('invoices.total'),
        t('invoices.paid'),
        t('invoices.balance') || 'Balance',
        t('appointments.date'),
      ];
      const rows = list.map((inv) => [
        inv.invoiceNumber || '',
        inv.patientId
          ? `${inv.patientId.firstName ?? ''} ${inv.patientId.lastName ?? ''}`.trim()
          : '',
        inv.status || '',
        String(inv.totalAmount ?? 0),
        String(inv.paidAmount ?? 0),
        String(inv.balanceAmount ?? 0),
        inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('invoices.exportSuccess'));
    } catch (err) {
      logger.error('Invoice export failed', err);
      showError(t('invoices.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [statusFilter, searchTerm, startDate, endDate, t]);

  const handleDelete = (invoiceId, invoiceNumber) => {
    openConfirm({
      title: t('invoices.deleteTitle'),
      message: t('invoices.confirmDeleteInvoiceMessage').replace(
        '{{invoiceNumber}}',
        invoiceNumber || '',
      ),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        setDeletingInvoiceId(invoiceId);
        try {
          const response = await apiClient.delete(`/invoices/${invoiceId}`);
          if (response.success) {
            showSuccess(t('invoices.invoiceDeleted'));
            fetchInvoices();
          } else {
            showError(response.error?.message || t('invoices.failedToDeleteInvoice'));
          }
        } catch (error) {
          logger.error('Failed to delete invoice', error);
          showError(error.message || t('invoices.failedToDeleteInvoice'));
        } finally {
          setDeletingInvoiceId(null);
        }
      },
    });
  };

  const handleMarkPaid = (invoiceId, invoiceNumber) => {
    openConfirm({
      title: t('invoices.markPaidTitle'),
      message: t('invoices.confirmMarkPaidMessage').replace(
        '{{invoiceNumber}}',
        invoiceNumber || '',
      ),
      confirmLabel: t('invoices.markPaid'),
      cancelLabel: t('common.cancel'),
      variant: 'info',
      onConfirm: async () => {
        setMarkingPaidId(invoiceId);
        try {
          const response = await apiClient.put(`/invoices/${invoiceId}`, {
            status: 'paid',
          });
          if (response.success) {
            showSuccess(t('invoices.invoiceMarkedPaid'));
            fetchInvoices();
          } else {
            showError(response.error?.message || t('invoices.failedToMarkPaid'));
          }
        } catch (error) {
          logger.error('Failed to mark invoice as paid', error);
          showError(error.message || t('invoices.failedToMarkPaid'));
        } finally {
          setMarkingPaidId(null);
        }
      },
    });
  };

  const handleRecordPayment = async () => {
    if (!recordPaymentInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setRecordingPayment(true);
    try {
      const response = await apiClient.post('/payments', {
        invoiceId: recordPaymentInvoice._id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes || undefined,
      });
      if (response.success) {
        showSuccess(t('invoices.paymentRecorded'));
        setRecordPaymentInvoice(null);
        setPaymentAmount('');
        setPaymentNotes('');
        fetchInvoices();
      } else {
        showError(response.error?.message || t('invoices.paymentRecordFailed'));
      }
    } catch (error) {
      logger.error('Failed to record payment', error);
      showError(error.message || t('invoices.paymentRecordFailed'));
    } finally {
      setRecordingPayment(false);
    }
  };

  const columns = [
    { header: t('invoices.invoiceHash'), accessor: 'invoiceNumber' },
    {
      header: t('appointments.patient'),
      accessor: (row) => `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('invoices.status'),
      accessor: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'paid'
              ? 'bg-secondary-100 text-secondary-700'
              : row.status === 'partial'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : row.status === 'pending'
                  ? 'bg-status-warning/10 text-status-warning'
                  : row.status === 'draft'
                    ? 'bg-neutral-100 text-neutral-700'
                    : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      header: t('invoices.total'),
      accessor: (row) => formatCurrency(row.totalAmount),
    },
    {
      header: t('invoices.paid'),
      accessor: (row) => formatCurrency(row.paidAmount),
    },
    {
      header: t('appointments.date'),
      accessor: (row) => new Date(row.invoiceDate).toLocaleDateString(),
    },
    {
      header: t('common.actions'),
      accessor: (row) => {
        const menuItems = [
          {
            key: 'view',
            label: t('common.view') || 'View',
            icon: <EyeIcon className='icon' />,
            onClick: () => router.push(`/invoices/${row._id}`),
          },
          ...(row.status === 'draft'
            ? [
                {
                  key: 'edit',
                  label: t('common.edit'),
                  icon: <PencilIcon className='icon' />,
                  onClick: () => router.push(`/invoices/${row._id}/edit`),
                },
                {
                  key: 'delete',
                  label: t('common.delete'),
                  icon: <TrashIcon className='icon' />,
                  danger: true,
                  onClick: () => handleDelete(row._id, row.invoiceNumber),
                  disabled: deletingInvoiceId === row._id,
                },
              ]
            : []),
          ...(row.status !== 'paid'
            ? [
                {
                  key: 'recordPayment',
                  label: t('invoices.recordPayment'),
                  onClick: () => {
                    setRecordPaymentInvoice(row);
                    setPaymentAmount(
                      String(row.balanceAmount ?? row.totalAmount - (row.paidAmount || 0) ?? 0),
                    );
                    setPaymentMethod('cash');
                    setPaymentNotes('');
                  },
                },
                {
                  key: 'markPaid',
                  label: t('invoices.markPaid'),
                  onClick: () => handleMarkPaid(row._id, row.invoiceNumber),
                  disabled: markingPaidId === row._id,
                },
              ]
            : []),
          {
            key: 'print',
            label: t('invoices.print') || 'Print',
            icon: <PrinterIcon className='icon' />,
            onClick: () => {
              setPrintInvoiceId(row._id);
              setShowPrintPreview(true);
            },
          },
        ];
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              items={menuItems}
              ariaLabel={t('common.actions') || 'Actions'}
              triggerSize='xs'
            />
          </div>
        );
      },
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
        title={t('invoices.title')}
        subtitle={t('invoices.invoiceList')}
        notifications={[]}
        unreadCount={0}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        actionButtons={
          <>
            <Button
              variant='secondary'
              size='md'
              onClick={handleExportCsv}
              disabled={exporting || invoices.length === 0}
              aria-label={t('invoices.exportCsv')}
            >
              {exporting ? (
                <span className='animate-pulse'>{t('common.loading')}</span>
              ) : (
                <>
                  <FileDownIcon className='icon icon-sm mr-1.5' aria-hidden />
                  {t('invoices.exportCsv') || 'Export CSV'}
                </>
              )}
            </Button>
            <Button href='/invoices/new' variant='primary' size='md' className='whitespace-nowrap'>
              + {t('invoices.createInvoice')}
            </Button>
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <div className='mb-4'>
          <PageSearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={() => fetchInvoices()}
            placeholder={t('invoices.searchPlaceholder') || 'Search by invoice #, patient...'}
          />
        </div>
        {loading ? (
          <Card>
            <TableSkeleton rows={10} cols={6} />
          </Card>
        ) : (
          <>
            <Card className='mb-4 p-4'>
              <div className='filter-row'>
                <span className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                  {t('invoices.filterByStatus')}
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className='filter-select'
                >
                  <option value='all'>{t('invoices.filterAll')}</option>
                  <option value='paid'>{t('invoices.paid')}</option>
                  <option value='pending'>{t('invoices.pending')}</option>
                <option value='partial'>{t('invoices.partial') || 'Partial'}</option>
                <option value='overdue'>{t('invoices.overdue')}</option>
                <option value='draft'>{t('invoices.draft')}</option>
                </select>
                <span className='text-sm text-neutral-500 dark:text-neutral-400'>
                  {t('invoices.filterDateRange')}
                </span>
                <div className='shrink-0 w-[10.5rem]'>
                  <Input
                    type='date'
                    size='md'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='filter-input-date'
                  />
                </div>
                <div className='shrink-0 w-[10.5rem]'>
                  <Input
                    type='date'
                    size='md'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className='filter-input-date'
                  />
                </div>
                <Button
                  variant='secondary'
                  onClick={() => fetchInvoices()}
                  className='filter-button'
                >
                  {t('common.filter')}
                </Button>
              </div>
            </Card>

            <Card>
              <Table
                data={invoices}
                columns={columns}
                onRowClick={(row) => router.push(`/invoices/${row._id}`)}
                emptyMessage={t('common.noDataFound')}
              />
            </Card>

            <InvoicePrintPreview
              invoiceId={printInvoiceId}
              isOpen={showPrintPreview}
              onClose={() => {
                setShowPrintPreview(false);
                setPrintInvoiceId(null);
              }}
            />

            <Modal
              isOpen={!!recordPaymentInvoice}
              onClose={() => {
                setRecordPaymentInvoice(null);
                setPaymentAmount('');
                setPaymentNotes('');
              }}
              title={t('invoices.recordPaymentTitle')}
            >
              {recordPaymentInvoice && (
                <div className='space-y-4'>
                  <p className='text-sm text-neutral-600'>
                    {t('invoices.invoiceHash')} {recordPaymentInvoice.invoiceNumber} ·{' '}
                    {t('appointments.patient')}: {recordPaymentInvoice.patientId?.firstName}{' '}
                    {recordPaymentInvoice.patientId?.lastName}
                  </p>
                  <p className='text-sm text-neutral-600'>
                    {t('invoices.pending')}:{' '}
                    {formatCurrency(
                      recordPaymentInvoice.balanceAmount ??
                        recordPaymentInvoice.totalAmount - (recordPaymentInvoice.paidAmount || 0),
                    )}
                  </p>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('invoices.paymentAmount')}
                    </label>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder='0.00'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('invoices.paymentMethod')}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm'
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      {t('invoices.paymentNotes')}
                    </label>
                    <Input
                      type='text'
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder={t('invoices.paymentNotes')}
                    />
                  </div>
                  <div className='flex justify-end gap-2 pt-2'>
                    <Button
                      variant='secondary'
                      onClick={() => {
                        setRecordPaymentInvoice(null);
                        setPaymentAmount('');
                        setPaymentNotes('');
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant='primary'
                      onClick={handleRecordPayment}
                      disabled={
                        recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0
                      }
                    >
                      {recordingPayment ? t('common.loading') : t('invoices.submitPayment')}
                    </Button>
                  </div>
                </div>
              )}
            </Modal>
          </>
        )}
      </div>
    </Layout>
  );
}
