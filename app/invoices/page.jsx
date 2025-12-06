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
import { InvoicePrintPreview } from '@/components/invoices/InvoicePrintPreview';
import { showSuccess, showError } from '@/lib/utils/toast';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';

export default function InvoicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printInvoiceId, setPrintInvoiceId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInvoices();
    }
  }, [authLoading, user]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/invoices');
      if (response.success && response.data) {
        // Handle paginated response structure
        if (response.data.data && Array.isArray(response.data.data)) {
          setInvoices(response.data.data);
        } else if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } else {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
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
      console.error('Failed to delete invoice:', error);
      showError(error.message || 'Failed to delete invoice');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleMarkPaid = async (invoiceId, invoiceNumber) => {
    if (!confirm(`Mark invoice ${invoiceNumber} as paid?`)) {
      return;
    }

    setMarkingPaidId(invoiceId);
    try {
      const response = await apiClient.put(`/invoices/${invoiceId}`, {
        status: 'paid',
      });
      if (response.success) {
        showSuccess('Invoice marked as paid');
        fetchInvoices(); // Refresh the list
      } else {
        showError(response.error?.message || 'Failed to mark invoice as paid');
      }
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      showError(error.message || 'Failed to mark invoice as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const columns = [
    { header: t('invoices.invoiceHash'), accessor: 'invoiceNumber' },
    {
      header: t('appointments.patient'),
      accessor: (row) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('invoices.status'),
      accessor: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : row.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : row.status === 'draft'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-100 text-gray-800'
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
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/invoices/${row._id}/edit`);
                }}
                title="Edit Invoice"
                className="p-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row._id, row.invoiceNumber);
                }}
                isLoading={deletingInvoiceId === row._id}
                className="text-red-600 hover:text-red-700 border-red-300 p-2"
                title="Delete Invoice"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </>
          )}
          {row.status !== 'paid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid(row._id, row.invoiceNumber);
              }}
              isLoading={markingPaidId === row._id}
              className="text-green-600 hover:text-green-700 border-green-300 p-2"
              title="Mark as Paid"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPrintInvoiceId(row._id);
              setShowPrintPreview(true);
            }}
            title="Print Invoice"
            className="p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </Button>
        </div>
      ),
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
          <h1 className="text-3xl font-bold text-gray-900">{t('invoices.title')}</h1>
          <p className="text-gray-600 mt-2">{t('invoices.invoiceList')}</p>
        </div>
        <Button onClick={() => router.push('/invoices/new')}>+ {t('invoices.createInvoice')}</Button>
      </div>

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
    </Layout>
  );
}

