'use client';

import { InvoicePrintPreview } from '@/components/invoices/InvoicePrintPreview';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

const ROUTE_KEY = 'route_invoices';

export default function InvoicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const tenantId = user?.tenantId ?? null;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printInvoiceId, setPrintInvoiceId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Hydrate from localStorage before paint (no flash, no hydration mismatch)
  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached?.invoices != null) {
      setInvoices(cached.invoices);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchInvoices = useCallback(async () => {
    const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
    if (!hasCache) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          params.append('status', 'pending');
        } else {
          params.append('status', statusFilter);
        }
      }
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate + 'T23:59:59.999Z').toISOString());
      const response = await apiClient.get(`/invoices?${params}`);
      if (response.success && response.data) {
        let invoicesList = extractArrayData(response);
        if (statusFilter === 'overdue') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          invoicesList = invoicesList.filter(
            (inv) => inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < today
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
      setLoading(false);
    }
  }, [tenantId, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInvoices();
    }
  }, [authLoading, user, fetchInvoices]);

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      paid: t('invoices.paid'),
      pending: t('invoices.pending'),
      overdue: t('invoices.overdue'),
      draft: 'Draft',
    };
    return statusMap[status] || status;
  };

  const handleDelete = async (invoiceId, invoiceNumber) => {
    if (
      !confirm(
        t('invoices.confirmDeleteInvoiceMessage').replace('{{invoiceNumber}}', invoiceNumber || '')
      )
    ) {
      return;
    }

    setDeletingInvoiceId(invoiceId);
    try {
      const response = await apiClient.delete(`/invoices/${invoiceId}`);
      if (response.success) {
        showSuccess('Invoice deleted successfully');
        fetchInvoices(); // Refresh the list
      } else {
        showError(response.error?.message || 'Failed to delete invoice');
      }
    } catch (error) {
      logger.error('Failed to delete invoice', error);
      showError(error.message || 'Failed to delete invoice');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleMarkPaid = async (invoiceId, invoiceNumber) => {
    if (
      !confirm(
        t('invoices.confirmMarkPaidMessage').replace('{{invoiceNumber}}', invoiceNumber || '')
      )
    ) {
      return;
    }

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
      accessor: (row) => (
        <div className='flex gap-2'>
          {row.status === 'draft' && (
            <>
              <Button
                variant='secondary'
                size='md'
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/invoices/${row._id}/edit`);
                }}
                title={t('invoices.editTitle')}
                className='whitespace-nowrap'
              >
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
                Edit
              </Button>
              <Button
                variant='secondary'
                size='md'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row._id, row.invoiceNumber);
                }}
                isLoading={deletingInvoiceId === row._id}
                disabled={deletingInvoiceId === row._id}
                className='whitespace-nowrap text-status-error border-status-error/30 hover:bg-status-error/10'
                title={t('invoices.deleteTitle')}
              >
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                Delete
              </Button>
            </>
          )}
          {row.status !== 'paid' && (
            <>
              <Button
                variant='secondary'
                size='md'
                onClick={(e) => {
                  e.stopPropagation();
                  setRecordPaymentInvoice(row);
                  setPaymentAmount(
                    String(row.balanceAmount ?? row.totalAmount - (row.paidAmount || 0) ?? 0)
                  );
                  setPaymentMethod('cash');
                  setPaymentNotes('');
                }}
                className='whitespace-nowrap'
                title={t('invoices.recordPayment')}
              >
                {t('invoices.recordPayment')}
              </Button>
              <Button
                variant='secondary'
                size='md'
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkPaid(row._id, row.invoiceNumber);
                }}
                isLoading={markingPaidId === row._id}
                disabled={markingPaidId === row._id}
                className='whitespace-nowrap'
                title={t('invoices.markPaidTitle')}
              >
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                {t('invoices.markPaid')}
              </Button>
            </>
          )}
          <Button
            variant='secondary'
            size='md'
            onClick={(e) => {
              e.stopPropagation();
              setPrintInvoiceId(row._id);
              setShowPrintPreview(true);
            }}
            title={t('invoices.printTitle')}
            className='whitespace-nowrap'
          >
            <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
              />
            </svg>
            Print
          </Button>
        </div>
      ),
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
        title={t('invoices.title')}
        subtitle={t('invoices.invoiceList')}
        notifications={[]}
        unreadCount={0}
        actionButton={
          <Button
            onClick={() => router.push('/invoices/new')}
            variant='primary'
            size='md'
            className='whitespace-nowrap'
          >
            + {t('invoices.createInvoice')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-4 p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-sm font-medium text-neutral-700'>
              {t('invoices.filterByStatus')}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-3 py-2 border border-neutral-300 rounded-lg text-sm'
            >
              <option value='all'>{t('invoices.filterAll')}</option>
              <option value='paid'>{t('invoices.paid')}</option>
              <option value='pending'>{t('invoices.pending')}</option>
              <option value='overdue'>{t('invoices.overdue')}</option>
              <option value='draft'>{t('invoices.draft')}</option>
            </select>
            <span className='text-sm text-neutral-500'>{t('invoices.filterDateRange')}</span>
            <Input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='w-40'
            />
            <Input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='w-40'
            />
            <Button variant='secondary' size='sm' onClick={() => fetchInvoices()}>
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
                    recordPaymentInvoice.totalAmount - (recordPaymentInvoice.paidAmount || 0)
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
                  disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  {recordingPayment ? t('common.loading') : t('invoices.submitPayment')}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
