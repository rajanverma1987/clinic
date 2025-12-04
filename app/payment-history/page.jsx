'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchSubscription();
    }
  }, [authLoading, user, router]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      // Get subscription
          const subResponse = await apiClient.get('/subscriptions');
          if (subResponse.success && subResponse.data) {
            setSubscription(subResponse.data);
            // Get payments for this subscription
            if (subResponse.data._id) {
              const paymentsResponse = await apiClient.get(
                `/subscriptions/${subResponse.data._id}?type=payments`
              );
          if (paymentsResponse.success && paymentsResponse.data) {
            setPayments(paymentsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

      const getStatusVariant = (status) => {
        switch (status.toUpperCase()) {
          case 'COMPLETED':
          case 'PAID':
            return 'success';
          case 'PENDING':
            return 'warning';
          case 'FAILED':
          case 'CANCELLED':
            return 'danger';
          default:
            return 'default';
        }
      };

  const columns = [
    {
      header: 'Date',
      accessor: (row) => (
        <div className="text-sm">
          {row.paidAt ? formatDate(row.paidAt) : formatDate(row.createdAt)}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <div className="font-medium">{formatPrice(row.amount, row.currency)}</div>
      ),
    },
    {
      header: 'Method',
      accessor: (row) => (
        <div className="text-sm text-gray-600 capitalize">{row.paymentMethod.toLowerCase()}</div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Tag variant={getStatusVariant(row.status)} size="sm">
          {row.status}
        </Tag>
      ),
    },
    {
      header: 'Transaction ID',
      accessor: (row) => (
        <div className="text-xs text-gray-500 font-mono">
          {row.paypalTransactionId || row.paypalOrderId || '-'}
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

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('subscription.paymentHistory')}</h1>
        <p className="text-gray-600 mt-2">{t('subscription.paymentHistoryDesc')}</p>
      </div>

      {subscription && (
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subscription.planId.name}</h3>
              <p className="text-sm text-gray-600">
                {formatPrice(subscription.planId.price, subscription.planId.currency)} /{' '}
                {subscription.planId.billingCycle === 'MONTHLY' ? 'month' : 'year'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/subscription')}>
              {t('subscription.viewDetails')}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">{t('subscription.noPaymentsFound')}</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                {t('subscription.totalPayments')}: {payments.length}
              </p>
            </div>
            <Table data={payments} columns={columns} emptyMessage={t('subscription.noPaymentsFound')} />
          </>
        )}
      </Card>
    </Layout>
  );
}

