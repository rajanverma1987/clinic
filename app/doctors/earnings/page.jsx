'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorEarningsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale } = useSettings();
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // day, week, month
  const [transactions, setTransactions] = useState([]);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [taxReports, setTaxReports] = useState(null);

  const userId = user?._id ?? user?.id ?? user?.userId;

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (!userId) return;
    fetchDoctorId();
  }, [authLoading, user, userId, router]);

  useEffect(() => {
    if (doctorId) {
      fetchEarnings();
      fetchTransactions();
      fetchPendingSettlements();
      fetchTaxReports();
    }
  }, [doctorId, selectedPeriod]);

  const fetchDoctorId = async () => {
    if (!userId || userId === 'undefined') return;
    try {
      const doctorResponse = await apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`);
      if (doctorResponse.success && doctorResponse.data) {
        setDoctorId(doctorResponse.data._id);
      } else {
        throw new Error('Doctor profile not found');
      }
    } catch (err) {
      logger.error('Failed to fetch doctor profile:', err);
    }
  };

  const fetchEarnings = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      const now = new Date();
      let startDate, endDate;

      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
      }

      const revenueResponse = await apiClient.get(
        `/reports/revenue?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (revenueResponse.success) {
        const data = revenueResponse.data;
        setEarnings({
          totalRevenue: data.totalRevenue || 0,
          totalPaid: data.totalPaid || 0,
          totalPending: data.totalPending || 0,
          paymentMethodBreakdown: data.paymentMethodBreakdown || {},
          period: selectedPeriod,
        });
      }
    } catch (err) {
      logger.error('Failed to fetch earnings:', err);
      setEarnings({
        totalRevenue: 0,
        totalPaid: 0,
        totalPending: 0,
        paymentMethodBreakdown: {},
        period: selectedPeriod,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!doctorId) return;

    try {
      // Fetch appointments with invoices for this doctor
      const now = new Date();
      let startDate, endDate;

      switch (selectedPeriod) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart;
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
      }

      const appointmentsResponse = await apiClient.get(
        `/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=50`
      );

      if (appointmentsResponse.success && Array.isArray(appointmentsResponse.data)) {
        // Fetch invoices for these appointments
        const appointmentIds = appointmentsResponse.data.map((apt) => apt._id);
        const invoicesResponse = await apiClient.get(
          `/invoices?appointmentIds=${appointmentIds.join(',')}&limit=50`
        );

        if (invoicesResponse.success && Array.isArray(invoicesResponse.data)) {
          setTransactions(invoicesResponse.data);
        }
      }
    } catch (err) {
      logger.error('Failed to fetch transactions:', err);
      setTransactions([]);
    }
  };

  const fetchPendingSettlements = async () => {
    if (!doctorId) return;
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/settlements?status=pending`);
      if (response.success) {
        setPendingSettlements(response.data || []);
      }
    } catch (err) {
      logger.error('Failed to fetch pending settlements:', err);
      setPendingSettlements([]);
    }
  };

  const fetchTaxReports = async () => {
    if (!doctorId) return;
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 0, 1); // Start of year
      const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // End of year

      const response = await apiClient.get(
        `/doctors/${doctorId}/tax-report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (response.success) {
        setTaxReports(response.data);
      }
    } catch (err) {
      logger.error('Failed to fetch tax reports:', err);
    }
  };

  const generateInvoice = async (transactionId) => {
    try {
      const response = await apiClient.post(`/invoices/generate`, {
        transactionId,
        doctorId,
      });
      if (response.success) {
        alert(t('doctors.invoicesGeneratedSuccess'));
        fetchTransactions();
      } else {
        alert(t('doctors.invoicesGeneratedFailed'));
      }
    } catch (err) {
      alert(t('doctors.invoicesGeneratedFailed'));
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  const formatCurrency = (amount) => formatCurrencyUtil(amount, currency, locale);

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader
          title={t('doctors.earningsPayments')}
          subtitle={t('doctors.earningsPaymentsSubtitle')}
        />

        {/* Period Selector */}
        <div className='flex gap-2'>
          <Button
            variant={selectedPeriod === 'day' ? 'primary' : 'secondary'}
            size='sm'
            onClick={() => setSelectedPeriod('day')}
          >
            {t('doctors.today')}
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'primary' : 'secondary'}
            size='sm'
            onClick={() => setSelectedPeriod('week')}
          >
            {t('doctors.thisWeek')}
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'primary' : 'secondary'}
            size='sm'
            onClick={() => setSelectedPeriod('month')}
          >
            {t('doctors.thisMonth')}
          </Button>
        </div>

        {/* Earnings Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-neutral-600'>
                  {t('doctors.totalRevenue')}
                </h3>
              </div>
              <p className='text-3xl font-bold text-neutral-900'>
                {formatCurrency(earnings?.totalRevenue || 0)}
              </p>
              <p className='text-sm text-neutral-500 mt-1'>
                {selectedPeriod === 'day' && t('doctors.today')}
                {selectedPeriod === 'week' && t('doctors.thisWeek')}
                {selectedPeriod === 'month' && t('doctors.thisMonth')}
              </p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-neutral-600'>{t('doctors.paid')}</h3>
              </div>
              <p className='text-3xl font-bold text-primary-600'>
                {formatCurrency(earnings?.totalPaid || 0)}
              </p>
              <p className='text-sm text-neutral-500 mt-1'>{t('doctors.completedPayments')}</p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-neutral-600'>{t('doctors.pending')}</h3>
              </div>
              <p className='text-3xl font-bold text-yellow-600'>
                {formatCurrency(earnings?.totalPending || 0)}
              </p>
              <p className='text-sm text-neutral-500 mt-1'>{t('doctors.awaitingPayment')}</p>
            </div>
          </Card>
        </div>

        {/* Payment Method Breakdown */}
        {earnings?.paymentMethodBreakdown &&
          Object.keys(earnings.paymentMethodBreakdown).length > 0 && (
            <Card>
              <div className='p-6'>
                <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                  {t('doctors.paymentMethodBreakdown')}
                </h2>
                <div className='space-y-3'>
                  {Object.entries(earnings.paymentMethodBreakdown).map(([method, amount]) => (
                    <div
                      key={method}
                      className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg'
                    >
                      <span className='font-medium text-neutral-900 capitalize'>{method}</span>
                      <span className='text-lg font-semibold text-neutral-900'>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

        {/* Pending Settlements */}
        {pendingSettlements.length > 0 && (
          <Card className='border-yellow-200 bg-yellow-50'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>
                  {t('doctors.pendingSettlements')}
                </h2>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => router.push(`/doctors/${doctorId}/settlements`)}
                >
                  {t('doctors.viewAll')}
                </Button>
              </div>
              <div className='space-y-3'>
                {pendingSettlements.slice(0, 5).map((settlement) => (
                  <div
                    key={settlement._id}
                    className='p-4 bg-white border border-yellow-200 rounded-lg flex items-center justify-between'
                  >
                    <div>
                      <p className='font-semibold text-neutral-900'>
                        Settlement #{settlement.settlementNumber || settlement._id.slice(-8)}
                      </p>
                      <p className='text-sm text-neutral-600'>
                        {t('doctors.period')} {new Date(settlement.startDate).toLocaleDateString()}{' '}
                        - {new Date(settlement.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-bold text-neutral-900'>
                        {formatCurrency(settlement.amount || 0)}
                      </p>
                      <p className='text-xs text-neutral-500'>
                        {t('doctors.due')} {new Date(settlement.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Tax Reports */}
        {taxReports && (
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-bold text-neutral-900'>
                  {t('doctors.taxReportThisYear')}
                </h2>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={async () => {
                    try {
                      const response = await apiClient.get(
                        `/doctors/${doctorId}/tax-report/download`
                      );
                      if (response.success && response.data?.pdfUrl) {
                        window.open(response.data.pdfUrl, '_blank');
                      } else {
                        alert(t('doctors.taxDownloadNotAvailable'));
                      }
                    } catch (err) {
                      alert(t('doctors.taxDownloadFailed'));
                    }
                  }}
                >
                  {t('doctors.downloadTaxReport')}
                </Button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 bg-neutral-50 rounded-lg'>
                  <p className='text-sm text-neutral-600 mb-1'>{t('doctors.totalEarnings')}</p>
                  <p className='text-2xl font-bold text-neutral-900'>
                    {formatCurrency(taxReports.totalEarnings || 0)}
                  </p>
                </div>
                <div className='p-4 bg-neutral-50 rounded-lg'>
                  <p className='text-sm text-neutral-600 mb-1'>{t('doctors.taxDeducted')}</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {formatCurrency(taxReports.taxDeducted || 0)}
                  </p>
                </div>
                <div className='p-4 bg-neutral-50 rounded-lg'>
                  <p className='text-sm text-neutral-600 mb-1'>{t('doctors.netEarnings')}</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {formatCurrency(taxReports.netEarnings || 0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-neutral-900'>
                {t('doctors.transactionHistory')}
              </h2>
              <div className='flex gap-2'>
                <Button variant='secondary' size='sm' onClick={() => fetchTransactions()}>
                  {t('doctors.refresh')}
                </Button>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={async () => {
                    try {
                      const response = await apiClient.post(`/invoices/generate-bulk`, {
                        doctorId,
                        period: selectedPeriod,
                      });
                      if (response.success) {
                        alert(t('doctors.invoicesGeneratedSuccess'));
                        fetchTransactions();
                      } else {
                        alert(t('doctors.invoicesGeneratedFailed'));
                      }
                    } catch (err) {
                      alert(t('doctors.invoicesGeneratedFailed'));
                    }
                  }}
                >
                  {t('doctors.generateInvoices')}
                </Button>
              </div>
            </div>

            {transactions.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-neutral-200'>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.date')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.patient')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.invoiceNumber')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.amount')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.status')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.paymentMethod')}
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>
                        {t('doctors.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className='border-b border-neutral-100 hover:bg-neutral-50'
                      >
                        <td className='py-3 px-4 text-sm text-neutral-600'>
                          {new Date(
                            transaction.invoiceDate || transaction.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className='py-3 px-4 text-sm text-neutral-900'>
                          {transaction.patientId?.firstName} {transaction.patientId?.lastName}
                        </td>
                        <td className='py-3 px-4 text-sm text-neutral-600'>
                          {transaction.invoiceNumber || transaction._id.slice(-8)}
                        </td>
                        <td className='py-3 px-4 text-sm font-medium text-neutral-900'>
                          {formatCurrency(transaction.totalAmount || 0)}
                        </td>
                        <td className='py-3 px-4'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.status || 'PENDING'}
                          </span>
                        </td>
                        <td className='py-3 px-4 text-sm text-neutral-600 capitalize'>
                          {transaction.paymentMethod || 'N/A'}
                        </td>
                        <td className='py-3 px-4'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => generateInvoice(transaction._id)}
                            disabled={transaction.invoiceGenerated}
                          >
                            {transaction.invoiceGenerated
                              ? t('doctors.invoiceGenerated')
                              : t('doctors.generateInvoice')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-12'>
                <p className='text-neutral-500'>{t('doctors.noTransactionsThisPeriod')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
