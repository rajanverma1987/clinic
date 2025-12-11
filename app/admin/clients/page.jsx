'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminClientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
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
      console.error('Failed to fetch plans:', error);
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
      console.error('Failed to fetch clients:', error);
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
          alert('Subscription updated successfully');
        }

        setCurrentClient(null);
        setSelectedPlanId('');
        fetchClients();
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert(error.message || 'Failed to update subscription');
    } finally {
      setUpdatingClientId(null);
    }
  };

  const handleToggleClientAccess = async (client) => {
    if (
      !window.confirm(
        `Are you sure you want to ${client.isActive ? 'deactivate' : 'activate'} this client? ` +
          `${
            client.isActive
              ? 'They will lose access to their account.'
              : 'They will regain access to their account.'
          }`
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.put(`/admin/clients/${client._id}`, {
        isActive: !client.isActive,
      });

      if (response.success) {
        fetchClients();
        alert(`Client ${client.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('Failed to update client status:', error);
      alert(error.message || 'Failed to update client status');
    }
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
        <div className='flex gap-2'>
          <Button variant='secondary' size='sm' onClick={() => handleUpdateSubscription(row)}>
            Update Subscription
          </Button>
          <Button
            variant={row.isActive ? 'secondary' : 'primary'}
            size='sm'
            onClick={() => handleToggleClientAccess(row)}
          >
            {row.isActive ? 'Remove Access' : 'Restore Access'}
          </Button>
        </div>
      ),
    },
  ];

  // Redirect handled in useEffect above
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-neutral-900'>Clients</h1>
        <p className='text-neutral-600 mt-2'>Manage all clinic clients and their subscriptions</p>
      </div>

      <Card>
        <Table data={clients} columns={columns} emptyMessage='No clients found' />
      </Card>

      {/* Update Subscription Modal */}
      {showUpdateModal && currentClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
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
                  placeholder='-- Select Plan --'
                  options={[
                    { value: '', label: '-- Select Plan --' },
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
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
                  The client needs to complete payment to activate their subscription. Send them the
                  payment link below.
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
                      alert('Payment link copied to clipboard!');
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className='bg-status-warning/10 border-l-4 border-status-warning p-4 mb-4'>
                <p className='text-sm text-status-warning'>
                  <strong>⚠️ Important:</strong> The subscription status is PENDING until the client
                  completes payment. Features will be disabled until payment is received.
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
    </Layout>
  );
}
