'use client';

import { InvoicePrintPreview } from '@/components/invoices/InvoicePrintPreview';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (!authLoading && user && invoiceId) {
      fetchInvoice();
    }
  }, [authLoading, user, invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}`);
      if (response.success && response.data) {
        setInvoice(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return formatCurrencyUtil(0, currency, locale);
    // Amount is stored in cents (minor units), convert to dollars
    return formatCurrencyUtil(amount, invoice?.currency || currency, locale);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusVariant = (status) => {
    const statusMap = {
      paid: 'success',
      pending: 'default',
      overdue: 'danger',
      draft: 'default',
      partial: 'default',
      cancelled: 'danger',
      refunded: 'danger',
    };
    return statusMap[status] || 'default';
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

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (!invoice) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-neutral-500'>Invoice not found</div>
        </div>
      </Layout>
    );
  }

  const patient = invoice.patientId || {};
  const items = invoice.items || [];

  return (
    <Layout>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle='Invoice Details'
        notifications={[]}
        unreadCount={0}
        actionButtons={
          <>
            <BackButton />
            <Button onClick={() => setShowPrintPreview(true)}>Print Invoice</Button>
          </>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            {/* Invoice Information */}
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Invoice Information</h2>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Invoice Number</label>
                    <p className='text-lg font-semibold'>{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Status</label>
                    <div className='mt-1'>
                      <Tag variant={getStatusVariant(invoice.status)} size='sm'>
                        {(invoice.status || '').toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Invoice Date</label>
                    <p>{formatDate(invoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Due Date</label>
                    <p>{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Patient Information */}
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Patient Information</h2>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Patient ID</label>
                    <p>{patient.patientId || patient._id}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Name</label>
                    <p>
                      {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Phone</label>
                    <p>{patient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-neutral-500'>Email</label>
                    <p>{patient.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Invoice Items */}
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Invoice Items</h2>
                <div className='clinic-table-wrap'>
                  <table className='clinic-table'>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th className='text-center'>Qty</th>
                        <th className='text-right'>Unit Price</th>
                        <th className='text-right'>Discount</th>
                        <th className='text-right'>Tax</th>
                        <th className='text-right'>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            {(item.type || '').charAt(0).toUpperCase() + (item.type || '').slice(1)}
                          </td>
                          <td>{item.description || ''}</td>
                          <td className='text-center'>{item.quantity || 1}</td>
                          <td className='text-right'>{formatCurrency(item.unitPrice || 0)}</td>
                          <td className='text-right'>{formatCurrency(item.discountAmount || 0)}</td>
                          <td className='text-right'>{formatCurrency(item.taxAmount || 0)}</td>
                          <td className='text-right font-medium'>
                            {formatCurrency(item.totalWithTax || item.total || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className='lg:col-span-1'>
            <Card>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Summary</h2>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-neutral-600'>Subtotal:</span>
                    <span className='font-medium'>{formatCurrency(invoice.subtotal || 0)}</span>
                  </div>
                  {(invoice.totalDiscount || 0) > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-neutral-600'>Discount:</span>
                      <span className='font-medium'>
                        -{formatCurrency(invoice.totalDiscount || 0)}
                      </span>
                    </div>
                  )}
                  {(invoice.totalTax || 0) > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-neutral-600'>Tax:</span>
                      <span className='font-medium'>{formatCurrency(invoice.totalTax || 0)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-lg font-bold border-t pt-3'>
                    <span>Total Amount:</span>
                    <span>{formatCurrency(invoice.totalAmount || 0)}</span>
                  </div>
                  {(invoice.paidAmount || 0) > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-neutral-600'>Paid Amount:</span>
                      <span className='font-medium text-secondary-600'>
                        {formatCurrency(invoice.paidAmount || 0)}
                      </span>
                    </div>
                  )}
                  {(invoice.balanceAmount || 0) > 0 && invoice.status !== 'paid' && (
                    <div className='flex justify-between text-lg font-bold border-t pt-3'>
                      <span>Balance Due:</span>
                      <span className='text-status-error'>
                        {formatCurrency(invoice.balanceAmount || 0)}
                      </span>
                    </div>
                  )}
                  {invoice.status === 'paid' && (
                    <div className='flex justify-between text-lg font-bold border-t pt-3'>
                      <span>Status:</span>
                      <span className='text-secondary-600'>Fully Paid</span>
                    </div>
                  )}
                </div>

                {invoice.notes && (
                  <div className='mt-6 pt-6 border-t'>
                    <h3 className='text-sm font-medium text-neutral-700 mb-2'>Notes</h3>
                    <p className='text-sm text-neutral-600'>{invoice.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <InvoicePrintPreview
          invoiceId={invoiceId}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
        />
      </div>
    </Layout>
  );
}
