'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';

// Available features that can be included/excluded in subscription plans
const AVAILABLE_FEATURES = [
  'Patient Management',
  'Appointment Scheduling',
  'Queue Management',
  'Prescriptions Management',
  'Invoice & Billing',
  'Inventory Management',
  'Reports & Analytics',
  'Automated Reminders',
  'Multi-Location Support',
  'Telemedicine',
  'API Access',
  'Custom Branding',
  'Priority Support',
  'Advanced Reports & Analytics',
  'Data Export',
  'Audit Logs',
  'HIPAA/GDPR Compliance',
  'White Label Solution',
  'Dedicated Support',
];

interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxUsers?: number;
  maxPatients?: number;
  maxStorageGB?: number;
  isPopular?: boolean;
  isHidden?: boolean;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    paypalPlanId: '',
    features: [] as string[],
    maxUsers: '',
    maxPatients: '',
    maxStorageGB: '',
    isPopular: false,
    isHidden: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [creatingPayPalPlan, setCreatingPayPalPlan] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login');
        return;
      }
      if (user.role !== 'super_admin') {
        // Not super admin - redirect to dashboard
        router.push('/dashboard');
        return;
      }
      // User is super admin - fetch plans
      fetchPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SubscriptionPlan[]>('/admin/subscription-plans');
      if (response.success) {
        // Ensure response.data is an array
        const plansData = Array.isArray(response.data) ? response.data : [];
        console.log('Fetched plans:', plansData.length);
        setPlans(plansData);
      } else {
        console.error('API response error:', response.error);
        setPlans([]);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (plan: SubscriptionPlan & { paypalPlanId?: string }) => {
    setEditingPlanId(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: (plan.price / 100).toFixed(2), // Convert from cents to dollars
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      paypalPlanId: plan.paypalPlanId || '',
      features: plan.features || [],
      maxUsers: plan.maxUsers?.toString() || '',
      maxPatients: plan.maxPatients?.toString() || '',
      maxStorageGB: plan.maxStorageGB?.toString() || '',
      isPopular: plan.isPopular || false,
      isHidden: plan.isHidden || false,
    });
    setShowForm(true);
  };

  const handleCreatePayPalPlan = async () => {
    // Validate required fields
    if (!formData.name || !formData.price) {
      alert('Please enter Plan Name and Price first');
      return;
    }

    const price = parseFloat(formData.price);
    if (price <= 0) {
      alert('Price must be greater than 0 to create PayPal plan');
      return;
    }

    setCreatingPayPalPlan(true);
    try {
      const response = await apiClient.post('/admin/subscription-plans/create-paypal-plan', {
        name: formData.name,
        description: formData.description || `${formData.name} subscription plan`,
        price: price, // In dollars
        currency: formData.currency,
        billingCycle: formData.billingCycle,
      });

      if (response.success && response.data) {
        const paypalPlanId = (response.data as any).paypalPlanId;
        setFormData({ ...formData, paypalPlanId });
        alert(`PayPal plan created successfully!\nPlan ID: ${paypalPlanId}`);
      }
    } catch (error: any) {
      console.error('Failed to create PayPal plan:', error);
      alert(error.message || 'Failed to create PayPal plan. Check PayPal credentials.');
    } finally {
      setCreatingPayPalPlan(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlanId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      billingCycle: 'MONTHLY',
      paypalPlanId: '',
      features: [],
      maxUsers: '',
      maxPatients: '',
      maxStorageGB: '',
      isPopular: false,
      isHidden: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        paypalPlanId: formData.paypalPlanId || undefined,
        features: formData.features || [],
        maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
        maxPatients: formData.maxPatients ? parseInt(formData.maxPatients) : undefined,
        maxStorageGB: formData.maxStorageGB ? parseInt(formData.maxStorageGB) : undefined,
        isPopular: formData.isPopular,
        isHidden: formData.isHidden,
      };

      let response;
      if (editingPlanId) {
        // Update existing plan
        response = await apiClient.put(`/admin/subscription-plans/${editingPlanId}`, payload);
      } else {
        // Create new plan
        response = await apiClient.post('/admin/subscription-plans', payload);
      }

      if (response.success) {
        handleCancel();
        fetchPlans();
      }
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      alert(error.message || `Failed to ${editingPlanId ? 'update' : 'create'} subscription plan`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  const columns = [
    {
      header: 'Plan Name',
      accessor: (row: SubscriptionPlan) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-gray-500 font-mono mt-1">
            ID: {row._id}
          </div>
          <div className="flex gap-2 mt-1">
            {row.isPopular && (
              <Tag variant="success" size="sm">
                Popular
              </Tag>
            )}
            {row.isHidden && (
              <Tag variant="default" size="sm">
                Hidden
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (row: SubscriptionPlan) => (
        <div>
          {formatPrice(row.price, row.currency)}
          <span className="text-gray-500 text-sm ml-1">
            /{row.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
          </span>
        </div>
      ),
    },
    {
      header: 'Features',
      accessor: (row: SubscriptionPlan) => (
        <div className="text-sm text-gray-600">
          {row.features.length} features
        </div>
      ),
    },
    {
      header: 'Limits',
      accessor: (row: SubscriptionPlan) => (
        <div className="text-sm text-gray-600">
          {row.maxUsers && <div>Users: {row.maxUsers}</div>}
          {row.maxPatients && <div>Patients: {row.maxPatients.toLocaleString()}</div>}
          {row.maxStorageGB && <div>Storage: {row.maxStorageGB}GB</div>}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: SubscriptionPlan) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(row._id);
              alert('Plan ID copied to clipboard!');
            }}
            title="Copy Plan ID for manual assignment"
          >
            Copy ID
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

  // Show error message if not logged in or not super admin
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">Please log in to access this page.</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'super_admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You need super admin privileges to access this page.</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-2">Manage subscription plans for clients</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchPlans()}>
            Refresh
          </Button>
        <Button onClick={() => {
          if (showForm) {
            handleCancel();
          } else {
            setShowForm(true);
            setEditingPlanId(null);
          }
        }}>
          {showForm ? 'Cancel' : '+ Create Plan'}
        </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingPlanId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Price (in dollars)"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'INR', label: 'INR' },
                ]}
                required
              />

              <Select
                label="Billing Cycle"
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'MONTHLY' | 'YEARLY' })}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'YEARLY', label: 'Yearly' },
                ]}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Plan ID (optional - for payment integration)
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.paypalPlanId}
                  onChange={(e) => setFormData({ ...formData, paypalPlanId: e.target.value })}
                  placeholder="e.g., P-7L918936KP7498103NEXRFNY"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreatePayPalPlan}
                  disabled={!formData.name || !formData.price || parseFloat(formData.price) <= 0 || creatingPayPalPlan}
                  isLoading={creatingPayPalPlan}
                  title="Create PayPal billing plan automatically"
                >
                  Create PayPal Plan
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formData.paypalPlanId ? (
                  <span className="text-green-600 font-medium">✓ PayPal integration configured</span>
                ) : (
                  <span>
                    Leave empty for free plans. For paid plans, click "Create PayPal Plan" button or enter manually.
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Max Users (optional)"
                type="number"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
              />

              <Input
                label="Max Patients (optional)"
                type="number"
                value={formData.maxPatients}
                onChange={(e) => setFormData({ ...formData, maxPatients: e.target.value })}
              />

              <Input
                label="Max Storage GB (optional)"
                type="number"
                value={formData.maxStorageGB}
                onChange={(e) => setFormData({ ...formData, maxStorageGB: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Features
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <label
                      key={feature}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              features: [...formData.features, feature],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              features: formData.features.filter((f) => f !== feature),
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
                {formData.features.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Select features to include in this plan
                  </p>
                )}
              </div>
              {formData.features.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {formData.features.length} feature(s) selected
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-700">
                  Mark as popular plan
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={formData.isHidden}
                  onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isHidden" className="ml-2 block text-sm text-gray-700">
                  Hide from Pricing Page
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={submitting}>
                {editingPlanId ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {plans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No subscription plans found</p>
            <Button onClick={() => fetchPlans()} variant="outline">
              Refresh
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {plans.length} subscription plan(s)
              </p>
            </div>
            <Table
              data={plans}
              columns={columns}
              emptyMessage="No subscription plans found"
            />
          </>
        )}
      </Card>
    </Layout>
  );
}

