'use client';

import { PencilIcon, TrashIcon, UserAddIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminClientsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingClientId, setUpdatingClientId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPaymentUrlModal, setShowPaymentUrlModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchClients();
      fetchPlans();
    }
  }, [authLoading, user, router]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showUpdateModal) {
        setShowUpdateModal(false);
        setCurrentClient(null);
        setSelectedPlanId('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showUpdateModal]);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/admin/subscription-plans');
      if (response.success && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : [];
        setPlans(plansData);
      }
    } catch (error) {
      logger.error('Failed to fetch plans', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/admin/clients');
      if (response.success && response.data) {
        const clientsData = Array.isArray(response.data) ? response.data : [];
        setClients(clientsData);
      }
    } catch (error) {
      logger.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleUpdateSubscription = (client) => {
    setCurrentClient(client);
    setSelectedPlanId(client.subscription?.planId?._id || '');
    setShowUpdateModal(true);
  };

  const handleSubmitUpdateSubscription = async () => {
    if (!currentClient || !selectedPlanId) return;

    setUpdatingClientId(currentClient._id);
    try {
      const response = await apiClient.put(`/admin/clients/${currentClient._id}`, {
        planId: selectedPlanId,
      });

      if (response.success && response.data) {
        setShowUpdateModal(false);

        // If plan requires payment, show PayPal approval URL
        if (response.data.requiresPayment && response.data.approvalUrl) {
          setPaymentUrl(response.data.approvalUrl);
          setShowPaymentUrlModal(true);
        } else {
          showSuccess(t('admin.subscriptionUpdated') || 'Subscription updated successfully');
        }

        setCurrentClient(null);
        setSelectedPlanId('');
        fetchClients();
      }
    } catch (error) {
      logger.error('Failed to update subscription', error);
      showError(
        error.message || t('admin.subscriptionUpdateFailed') || 'Failed to update subscription',
      );
    } finally {
      setUpdatingClientId(null);
    }
  };

  const handleToggleClientAccess = async (client) => {
    const action = client.isActive ? 'deactivate' : 'activate';
    openConfirm({
      title: client.isActive ? t('admin.clientDeactivate') : t('admin.clientActivate'),
      message: client.isActive
        ? t('admin.clientDeactivateConfirm')
        : t('admin.clientActivateConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await apiClient.put(`/admin/clients/${client._id}`, {
            isActive: !client.isActive,
          });
          if (response.success) {
            fetchClients();
            showSuccess(
              client.isActive ? t('admin.clientDeactivated') : t('admin.clientActivated'),
            );
          }
        } catch (error) {
          logger.error('Failed to update client status', error);
          showError(error.message || t('admin.clientStatusUpdateFailed'));
        }
      },
    });
  };

  const columns = [
    {
      header: 'Client Name',
      accessor: (row) => row.name,
    },
    {
      header: 'Region',
      accessor: (row) => row.region,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Tag variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      header: 'Subscription',
      accessor: (row) => {
        if (!row.subscription || !row.subscription.planId) {
          return <Tag variant='default'>No Subscription</Tag>;
        }
        return (
          <div>
            <div className='font-medium'>{row.subscription.planId.name}</div>
            <div className='text-sm text-neutral-500'>
              {formatCurrency(row.subscription.planId.price)}/
              {row.subscription.planId.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Subscription Status',
      accessor: (row) => {
        if (!row.subscription) return '-';
        const statusColors = {
          ACTIVE: 'success',
          CANCELLED: 'danger',
          SUSPENDED: 'warning',
          EXPIRED: 'danger',
          PENDING: 'warning',
        };
        return (
          <Tag variant={statusColors[row.subscription.status] || 'default'}>
            {row.subscription.status}
          </Tag>
        );
      },
    },
    {
      header: 'Next Billing',
      accessor: (row) => {
        if (!row.subscription) return '-';
        return new Date(row.subscription.currentPeriodEnd).toLocaleDateString();
      },
    },
    {
      header: 'Created',
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <ActionsMenu
          ariaLabel={t('common.actions') || 'Actions'}
          triggerSize='xs'
          items={[
            {
              key: 'update',
              label: t('common.update') || 'Update',
              icon: <PencilIcon className='icon icon-sm' />,
              onClick: () => handleUpdateSubscription(row),
            },
            {
              key: 'toggle',
              label: row.isActive
                ? t('common.remove') || 'Remove'
                : t('common.restore') || 'Restore',
              icon: row.isActive ? (
                <TrashIcon className='icon icon-sm' />
              ) : (
                <UserAddIcon className='icon icon-sm' />
              ),
              onClick: () => handleToggleClientAccess(row),
              danger: row.isActive,
            },
          ]}
        />
      ),
    },
  ];

  // Redirect handled in useEffect above
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout title={t('admin.clients')} subtitle={t('admin.clientsManagementSubtitle')}>
      <div className='admin-page-content'>
        <Card>
          <Table data={clients} columns={columns} emptyMessage={t('admin.noClientsFound')} />
        </Card>

        {/* Update Subscription Modal */}
        {showUpdateModal && currentClient && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='max-w-md w-full mx-4'>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Update Subscription</h2>
                <p className='text-sm text-neutral-600 mb-4'>
                  Client: <span className='font-medium'>{currentClient.name}</span>
                </p>

                <div className='mb-4'>
                  <Select
                    label='Select New Plan'
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    required
                    placeholder={t('admin.selectPlanPlaceholder')}
                    options={[
                      { value: '', label: t('admin.selectPlanPlaceholder') },
                      ...plans.map((plan) => ({
                        value: plan._id,
                        label: `${plan.name} - ${formatCurrency(plan.price)}/${
                          plan.billingCycle === 'MONTHLY' ? 'month' : 'year'
                        }`,
                      })),
                    ]}
                  />
                </div>

                <div className='flex gap-4'>
                  <Button
                    onClick={handleSubmitUpdateSubscription}
                    disabled={!selectedPlanId || updatingClientId === currentClient._id}
                    isLoading={updatingClientId === currentClient._id}
                  >
                    Update Subscription
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={() => {
                      setShowUpdateModal(false);
                      setCurrentClient(null);
                      setSelectedPlanId('');
                    }}
                    disabled={updatingClientId === currentClient._id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Payment URL Modal - Shows PayPal approval link for client */}
        {showPaymentUrlModal && paymentUrl && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='max-w-2xl w-full mx-4'>
              <div className='p-6'>
                <h2 className='text-xl font-semibold mb-4 text-secondary-600'>
                  ✅ Subscription Created - Payment Required
                </h2>

                <div className='bg-primary-100 border-l-4 border-primary-500 p-4 mb-4'>
                  <p className='text-sm text-primary-700 mb-2'>
                    <strong>PayPal subscription created successfully!</strong>
                  </p>
                  <p className='text-sm text-primary-600'>
                    The client needs to complete payment to activate their subscription. Send them
                    the payment link below.
                  </p>
                </div>

                <div className='mb-4'>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    Payment Link (Send to Client):
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      readOnly
                      value={paymentUrl}
                      className='flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-sm font-mono'
                    />
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => {
                        navigator.clipboard.writeText(paymentUrl);
                        showSuccess(
                          t('admin.paymentLinkCopied') || 'Payment link copied to clipboard',
                        );
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>

                <div className='bg-status-warning/10 border-l-4 border-status-warning p-4 mb-4'>
                  <p className='text-sm text-status-warning'>
                    <strong>⚠️ Important:</strong> The subscription status is PENDING until the
                    client completes payment. Features will be disabled until payment is received.
                  </p>
                </div>

                <div className='flex gap-4'>
                  <Button
                    onClick={() => {
                      window.open(paymentUrl, '_blank');
                    }}
                    className='flex-1'
                  >
                    Open Payment Link
                  </Button>
                  <Button
                    variant='secondary'
                    onClick={() => {
                      setShowPaymentUrlModal(false);
                      setPaymentUrl('');
                    }}
                    className='flex-1'
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
