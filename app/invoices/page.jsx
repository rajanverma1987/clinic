'use client';

import { InvoicePrintPreview } from '@/components/invoices/InvoicePrintPreview';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaCheck, FaPrint } from 'react-icons/fa';

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
    if (
      !confirm(
        `Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`
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
                size='sm'
                iconOnly
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/invoices/${row._id}/edit`);
                }}
                title='Edit Invoice'
              >
                <FaEdit />
              </Button>
              <Button
                variant='danger'
                size='sm'
                iconOnly
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row._id, row.invoiceNumber);
                }}
                isLoading={deletingInvoiceId === row._id}
                disabled={deletingInvoiceId === row._id}
                title='Delete Invoice'
              >
                <FaTrash />
              </Button>
            </>
          )}
          {row.status !== 'paid' && (
            <Button
              variant='success'
              size='sm'
              iconOnly
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid(row._id, row.invoiceNumber);
              }}
              isLoading={markingPaidId === row._id}
              disabled={markingPaidId === row._id}
              title='Mark as Paid'
            >
              <FaCheck />
            </Button>
          )}
          <Button
            variant='secondary'
            size='sm'
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              setPrintInvoiceId(row._id);
              setShowPrintPreview(true);
            }}
            title='Print Invoice'
          >
            <FaPrint />
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
    return <Loader fullScreen size='lg' />;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <DashboardHeader
          title={t('invoices.title')}
          subtitle={t('invoices.invoiceList')}
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
      </div>
    </Layout>
  );
}
