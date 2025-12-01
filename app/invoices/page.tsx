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

interface Invoice {
  _id: string;
  invoiceNumber: string;
  patientId: {
    firstName: string;
    lastName: string;
  };
  status: string;
  totalAmount: number;
  paidAmount: number;
  invoiceDate: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInvoices();
    }
  }, [authLoading, user]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Invoice[]>('/invoices');
      if (response.success && response.data) {
        setInvoices(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: t('invoices.paid'),
      pending: t('invoices.pending'),
      overdue: t('invoices.overdue'),
    };
    return statusMap[status] || status;
  };

  const columns = [
    { header: t('invoices.invoiceHash'), accessor: 'invoiceNumber' as keyof Invoice },
    {
      header: t('appointments.patient'),
      accessor: (row: Invoice) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('invoices.status'),
      accessor: (row: Invoice) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : row.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      header: t('invoices.total'),
      accessor: (row: Invoice) => formatCurrency(row.totalAmount),
    },
    {
      header: t('invoices.paid'),
      accessor: (row: Invoice) => formatCurrency(row.paidAmount),
    },
    {
      header: t('appointments.date'),
      accessor: (row: Invoice) => new Date(row.invoiceDate).toLocaleDateString(),
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
    </Layout>
  );
}

