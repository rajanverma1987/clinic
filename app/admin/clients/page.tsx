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
import { Select } from '@/components/ui/Select';

interface Client {
  _id: string;
  name: string;
  slug: string;
  region: string;
  isActive: boolean;
  createdAt: string;
  subscription?: {
    _id: string;
    status: string;
    planId: {
      _id: string;
      name: string;
      price: number;
      billingCycle: string;
    };
    currentPeriodEnd: string;
  } | null;
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
}

export default function AdminClientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

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
    const handleEsc = (e: KeyboardEvent) => {
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
      const response = await apiClient.get<SubscriptionPlan[]>('/admin/subscription-plans');
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
      const response = await apiClient.get<Client[]>('/admin/clients');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const handleUpdateSubscription = (client: Client) => {
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

      if (response.success) {
        setShowUpdateModal(false);
        setCurrentClient(null);
        setSelectedPlanId('');
        fetchClients();
        alert('Subscription updated successfully');
      }
    } catch (error: any) {
      console.error('Failed to update subscription:', error);
      alert(error.message || 'Failed to update subscription');
    } finally {
      setUpdatingClientId(null);
    }
  };

  const handleToggleClientAccess = async (client: Client) => {
    if (!window.confirm(
      `Are you sure you want to ${client.isActive ? 'deactivate' : 'activate'} this client? ` +
      `${client.isActive ? 'They will lose access to their account.' : 'They will regain access to their account.'}`
    )) {
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
    } catch (error: any) {
      console.error('Failed to update client status:', error);
      alert(error.message || 'Failed to update client status');
    }
  };

  const columns = [
    {
      header: 'Client Name',
      accessor: (row: Client) => row.name,
    },
    {
      header: 'Region',
      accessor: (row: Client) => row.region,
    },
    {
      header: 'Status',
      accessor: (row: Client) => (
        <Tag variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      header: 'Subscription',
      accessor: (row: Client) => {
        if (!row.subscription) {
          return <Tag variant="default">No Subscription</Tag>;
        }
        return (
          <div>
            <div className="font-medium">{row.subscription.planId.name}</div>
            <div className="text-sm text-gray-500">
              {formatCurrency(row.subscription.planId.price)}/{row.subscription.planId.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Subscription Status',
      accessor: (row: Client) => {
        if (!row.subscription) return '-';
        const statusColors: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
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
      accessor: (row: Client) => {
        if (!row.subscription) return '-';
        return new Date(row.subscription.currentPeriodEnd).toLocaleDateString();
      },
    },
    {
      header: 'Created',
      accessor: (row: Client) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row: Client) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateSubscription(row)}
          >
            Update Subscription
          </Button>
          <Button
            variant={row.isActive ? 'outline' : 'primary'}
            size="sm"
            onClick={() => handleToggleClientAccess(row)}
          >
            {row.isActive ? 'Remove Access' : 'Restore Access'}
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600 mt-2">Manage all clinic clients and their subscriptions</p>
      </div>

      <Card>
        <Table
          data={clients}
          columns={columns}
          emptyMessage="No clients found"
        />
      </Card>

      {/* Update Subscription Modal */}
      {showUpdateModal && currentClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Update Subscription</h2>
              <p className="text-sm text-gray-600 mb-4">
                Client: <span className="font-medium">{currentClient.name}</span>
              </p>
              
              <div className="mb-4">
                <Select
                  label="Select New Plan"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                  placeholder="-- Select Plan --"
                  options={[
                    { value: '', label: '-- Select Plan --' },
                    ...plans.map((plan) => ({
                      value: plan._id,
                      label: `${plan.name} - ${formatCurrency(plan.price)}/${plan.billingCycle === 'MONTHLY' ? 'month' : 'year'}`,
                    })),
                  ]}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSubmitUpdateSubscription}
                  disabled={!selectedPlanId || updatingClientId === currentClient._id}
                  isLoading={updatingClientId === currentClient._id}
                >
                  Update Subscription
                </Button>
                <Button
                  variant="outline"
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
    </Layout>
  );
}

