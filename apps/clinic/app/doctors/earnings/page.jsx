'use client';

import { RefreshCwIcon } from '@/components/icons';
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
import { showError, showSuccess } from '@/lib/utils/toast';
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

  const userId = user?._id ?? user?.id ?? user?.userId ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      setLoading(false);
      router.push('/dashboard');
      return;
    }
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchDoctorId();
  }, [authLoading, user, userId, router]);

  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

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
      setLoading(true);
      const doctorResponse = await apiClient.get(`/doctors/user/${encodeURIComponent(userId)}`);
      if (doctorResponse.success && doctorResponse.data) {
        setDoctorId(doctorResponse.data._id);
        // Keep loading true; effect will run fetchEarnings and clear loading when done
      } else {
        setDoctorId(null);
        setLoading(false);
      }
    } catch (err) {
      logger.error('Failed to fetch doctor profile:', err);
      setDoctorId(null);
      setLoading(false);
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
        `/reports/revenue?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
        `/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&limit=50`,
      );

      if (appointmentsResponse.success && Array.isArray(appointmentsResponse.data)) {
        // Fetch invoices for these appointments
        const appointmentIds = appointmentsResponse.data.map((apt) => apt._id);
        const invoicesResponse = await apiClient.get(
          `/invoices?appointmentIds=${appointmentIds.join(',')}&limit=50`,
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
        `/doctors/${doctorId}/tax-report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
        showSuccess(t('doctors.invoicesGeneratedSuccess'));
        fetchTransactions();
      } else {
        showError(t('doctors.invoicesGeneratedFailed'));
      }
    } catch (err) {
      showError(t('doctors.invoicesGeneratedFailed'));
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <Loader type='page' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  const formatCurrency = (amount) => formatCurrencyUtil(amount, currency, locale);

  if (!doctorId && !loading) {
    return (
      <Layout>
        <div style={{ padding: '0 10px' }} className='space-y-6'>
          <PageHeader
            title={t('doctors.earningsPayments')}
            subtitle={t('doctors.earningsPaymentsSubtitle')}
          />
          <Card>
            <div className='p-8 text-center text-neutral-600'>
              {t('doctors.doctorProfileNotFound')}
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <PageHeader
          title={t('doctors.earningsPayments')}
          subtitle={t('doctors.earningsPaymentsSubtitle')}
        />

        {loading ? (
          <Loader type='section' text={t('common.loading')} />
        ) : (
          <>
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
                    <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('doctors.totalRevenue')}
                    </h3>
                  </div>
                  <p className='text-3xl font-bold text-neutral-900 dark:text-neutral-100'>
                    {formatCurrency(earnings?.totalRevenue || 0)}
                  </p>
                  <p className='text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
                    {selectedPeriod === 'day' && t('doctors.today')}
                    {selectedPeriod === 'week' && t('doctors.thisWeek')}
                    {selectedPeriod === 'month' && t('doctors.thisMonth')}
                  </p>
                </div>
              </Card>

              <Card>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('doctors.paid')}
                    </h3>
                  </div>
                  <p className='text-3xl font-bold text-primary-600 dark:text-primary-400'>
                    {formatCurrency(earnings?.totalPaid || 0)}
                  </p>
                  <p className='text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
                    {t('doctors.completedPayments')}
                  </p>
                </div>
              </Card>

              <Card>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-medium text-neutral-600 dark:text-neutral-400'>
                      {t('doctors.pending')}
                    </h3>
                  </div>
                  <p className='text-3xl font-bold text-yellow-600 dark:text-yellow-400'>
                    {formatCurrency(earnings?.totalPending || 0)}
                  </p>
                  <p className='text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
                    {t('doctors.awaitingPayment')}
                  </p>
                </div>
              </Card>
            </div>

            {/* Payment Method Breakdown */}
            {earnings?.paymentMethodBreakdown &&
              Object.keys(earnings.paymentMethodBreakdown).length > 0 && (
                <Card>
                  <div className='p-6'>
                    <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4'>
                      {t('doctors.paymentMethodBreakdown')}
                    </h2>
                    <div className='space-y-3'>
                      {Object.entries(earnings.paymentMethodBreakdown).map(([method, amount]) => (
                        <div
                          key={method}
                          className='flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg'
                        >
                          <span className='font-medium text-neutral-900 dark:text-neutral-100 capitalize'>
                            {method}
                          </span>
                          <span className='text-lg font-semibold text-neutral-900 dark:text-neutral-100'>
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
              <Card className='border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'>
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
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
                        className='p-4 bg-white dark:bg-neutral-800 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center justify-between'
                      >
                        <div>
                          <p className='font-semibold text-neutral-900 dark:text-neutral-100'>
                            Settlement #{settlement.settlementNumber || settlement._id.slice(-8)}
                          </p>
                          <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                            {t('doctors.period')}{' '}
                            {new Date(settlement.startDate).toLocaleDateString()} -{' '}
                            {new Date(settlement.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
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
                    <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                      {t('doctors.taxReportThisYear')}
                    </h2>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={async () => {
                        try {
                          const response = await apiClient.get(
                            `/doctors/${doctorId}/tax-report/download`,
                          );
                          if (response.success && response.data?.pdfUrl) {
                            window.open(response.data.pdfUrl, '_blank');
                          } else {
                            showError(t('doctors.taxDownloadNotAvailable'));
                          }
                        } catch (err) {
                          showError(t('doctors.taxDownloadFailed'));
                        }
                      }}
                    >
                      {t('doctors.downloadTaxReport')}
                    </Button>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg'>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-1'>
                        {t('doctors.totalEarnings')}
                      </p>
                      <p className='text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(taxReports.totalEarnings || 0)}
                      </p>
                    </div>
                    <div className='p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg'>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-1'>
                        {t('doctors.taxDeducted')}
                      </p>
                      <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                        {formatCurrency(taxReports.taxDeducted || 0)}
                      </p>
                    </div>
                    <div className='p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg'>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-1'>
                        {t('doctors.netEarnings')}
                      </p>
                      <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
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
                  <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100'>
                    {t('doctors.transactionHistory')}
                  </h2>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      iconOnly
                      onClick={() => fetchTransactions()}
                      title={t('doctors.refresh')}
                      aria-label={t('doctors.refresh')}
                    >
                      <RefreshCwIcon className='icon icon-sm' ariaHidden />
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
                            showSuccess(t('doctors.invoicesGeneratedSuccess'));
                            fetchTransactions();
                          } else {
                            showError(t('doctors.invoicesGeneratedFailed'));
                          }
                        } catch (err) {
                          showError(t('doctors.invoicesGeneratedFailed'));
                        }
                      }}
                    >
                      {t('doctors.generateInvoices')}
                    </Button>
                  </div>
                </div>

                {transactions.length > 0 ? (
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('doctors.date')}</th>
                          <th>{t('doctors.patient')}</th>
                          <th>{t('doctors.invoiceNumber')}</th>
                          <th>{t('doctors.amount')}</th>
                          <th>{t('doctors.status')}</th>
                          <th>{t('doctors.paymentMethod')}</th>
                          <th>{t('doctors.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td className='text-neutral-600'>
                              {new Date(
                                transaction.invoiceDate || transaction.createdAt,
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              {transaction.patientId?.firstName} {transaction.patientId?.lastName}
                            </td>
                            <td className='text-neutral-600'>
                              {transaction.invoiceNumber || transaction._id.slice(-8)}
                            </td>
                            <td className='font-medium'>
                              {formatCurrency(transaction.totalAmount || 0)}
                            </td>
                            <td>
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
                            <td className='capitalize text-neutral-600'>
                              {transaction.paymentMethod || 'N/A'}
                            </td>
                            <td>
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
          </>
        )}
      </div>
    </Layout>
  );
}
