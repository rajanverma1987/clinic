'use client';

import { DocumentIcon, LayoutDashboardIcon, ListChecksIcon, PencilIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const VIEW_TABLE = 'table';
const VIEW_CARDS = 'cards';

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

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(VIEW_TABLE);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState({
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

  const fetchPlans = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await apiClient.get('/admin/subscription-plans');
      if (response?.success && response.data != null) {
        const raw = response.data;
        const plansData = Array.isArray(raw) ? raw : (raw.plans || raw.items || []);
        if (!Array.isArray(plansData)) {
          logger.warn('Plans data is not an array', { type: typeof plansData });
          setPlans([]);
        } else {
          logger.debug('Fetched plans', { count: plansData.length });
          setPlans(plansData);
        }
      } else {
        logger.warn('API response error', { error: response?.error });
        setPlans([]);
      }
    } catch (error) {
      logger.error('Failed to fetch plans', error);
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEdit = async (plan) => {
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
      showError(t('admin.enterPlanNamePrice') || 'Please enter Plan Name and Price first');
      return;
    }

    const price = parseFloat(formData.price);
    if (price <= 0) {
      showError(
        t('admin.priceMustBePositive') || 'Price must be greater than 0 to create PayPal plan',
      );
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
        const paypalPlanId = response.data?.paypalPlanId;
        setFormData({ ...formData, paypalPlanId });
        showSuccess(
          t('admin.paypalPlanCreated') + (paypalPlanId ? ` Plan ID: ${paypalPlanId}` : ''),
        );
      }
    } catch (error) {
      logger.error('Failed to create PayPal plan', error);
      showError(
        error.message || t('admin.paypalPlanCreateFailed') || 'Failed to create PayPal plan.',
      );
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

  const handleSubmit = async (e) => {
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
    } catch (error) {
      logger.error('Failed to save plan', error);
      showError(
        error.message ||
          (editingPlanId ? t('admin.planUpdateFailed') : t('admin.planCreateFailed')) ||
          'Failed to save plan',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  const columns = [
    {
      header: t('admin.planName'),
      accessor: (row) => (
        <div>
          <div className='font-medium'>{row.name}</div>
          <div className='text-xs text-neutral-500 font-mono mt-1'>ID: {row._id}</div>
          <div className='flex gap-2 mt-1'>
            {row.isPopular && (
              <Tag variant='success' size='sm'>
                {t('admin.popular')}
              </Tag>
            )}
            {row.isHidden && (
              <Tag variant='default' size='sm'>
                {t('admin.hidden')}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      header: t('common.price') || 'Price',
      accessor: (row) => (
        <div>
          {formatPrice(row.price, row.currency)}
          <span className='text-neutral-500 text-sm ml-1'>
            /{row.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
          </span>
        </div>
      ),
    },
    {
      header: t('admin.featuresLabel'),
      accessor: (row) => (
        <div className='text-sm text-neutral-600'>
          {(t('admin.featuresCount') || '{{count}} features').replace(
            '{{count}}',
            String((row.features || []).length),
          )}
        </div>
      ),
    },
    {
      header: t('admin.limits'),
      accessor: (row) => (
        <div className='text-sm text-neutral-600'>
          {row.maxUsers != null && <div>Users: {row.maxUsers}</div>}
          {row.maxPatients != null && (
            <div>Patients: {Number(row.maxPatients).toLocaleString()}</div>
          )}
          {row.maxStorageGB != null && <div>Storage: {row.maxStorageGB}GB</div>}
          {!row.maxUsers && !row.maxPatients && !row.maxStorageGB && '—'}
        </div>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <ActionsMenu
          ariaLabel={t('common.actions')}
          triggerSize='xs'
          items={[
            {
              key: 'edit',
              label: t('common.edit'),
              icon: <PencilIcon className='icon icon-sm' />,
              onClick: () => handleEdit(row),
            },
            {
              key: 'copy',
              label: t('admin.copyPlanId'),
              icon: <DocumentIcon className='icon icon-sm' />,
              onClick: () => {
                navigator.clipboard.writeText(row._id);
                showSuccess(t('admin.planIdCopied'));
              },
            },
          ]}
        />
      ),
    },
  ];

  if (!user) return null;
  if (loading) return <Loader type='page' text={t('common.loading')} />;
  if (user.role !== 'super_admin') return null;

  return (
    <Layout>
      <PageHeader
        title={t('admin.subscriptionPlans')}
        subtitle={t('admin.subscriptionPlansSubtitle')}
        notifications={[]}
        unreadCount={0}
        onRefresh={() => fetchPlans(true)}
        refreshing={refreshing}
        actionButtons={
          <div className='flex items-center gap-2'>
            <div
              className='inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5'
              role='tablist'
              aria-label={t('admin.viewTable')}
            >
              <button
                type='button'
                role='tab'
                aria-selected={viewMode === VIEW_TABLE}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === VIEW_TABLE
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                onClick={() => setViewMode(VIEW_TABLE)}
              >
                <ListChecksIcon className='icon icon-sm' />
                {t('admin.viewTable')}
              </button>
              <button
                type='button'
                role='tab'
                aria-selected={viewMode === VIEW_CARDS}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === VIEW_CARDS
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                onClick={() => setViewMode(VIEW_CARDS)}
              >
                <LayoutDashboardIcon className='icon icon-sm' />
                {t('admin.viewCards')}
              </button>
            </div>
            <Button
              variant='primary'
              onClick={() => {
                if (showForm) handleCancel();
                else {
                  setShowForm(true);
                  setEditingPlanId(null);
                }
              }}
            >
              {showForm ? t('common.cancel') : `+ ${t('admin.createPlan')}`}
            </Button>
          </div>
        }
      />
      <div className='admin-page-content'>
        {showForm && (
          <Card className='mb-6'>
            <form onSubmit={handleSubmit} className='space-y-6' noValidate>
              <h2 className='text-xl font-semibold mb-4'>
                {editingPlanId
                  ? t('admin.editSubscriptionPlan')
                  : t('admin.createSubscriptionPlan')}
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input
                  label={t('admin.planName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label={t('admin.priceInDollars')}
                  type='number'
                  step='0.01'
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />

                <Select
                  label={t('common.currency') || 'Currency'}
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
                  label={t('admin.billingCycle') || 'Billing Cycle'}
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  options={[
                    { value: 'MONTHLY', label: t('common.monthly') || 'Monthly' },
                    { value: 'YEARLY', label: t('common.yearly') || 'Yearly' },
                  ]}
                  required
                />
              </div>

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.paypalPlanIdOptional')}
                </label>
                <div className='flex gap-2'>
                  <Input
                    value={formData.paypalPlanId}
                    onChange={(e) => setFormData({ ...formData, paypalPlanId: e.target.value })}
                    placeholder={t('admin.planIdPlaceholder')}
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleCreatePayPalPlan}
                    disabled={
                      !formData.name ||
                      !formData.price ||
                      parseFloat(formData.price) <= 0 ||
                      creatingPayPalPlan
                    }
                    isLoading={creatingPayPalPlan}
                    title={t('admin.createPayPalPlan')}
                  >
                    {t('admin.createPayPalPlan')}
                  </Button>
                </div>
                <p className='text-sm text-neutral-500 mt-1'>
                  {formData.paypalPlanId ? (
                    <span className='text-secondary-600 font-medium'>
                      ✓ PayPal integration configured
                    </span>
                  ) : (
                    <span>
                      Leave empty for free plans. For paid plans, click &quot;Create PayPal
                      Plan&quot; or enter manually.
                    </span>
                  )}
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input
                  label={t('admin.maxUsersOptional')}
                  type='number'
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                />

                <Input
                  label={t('admin.maxPatientsOptional')}
                  type='number'
                  value={formData.maxPatients}
                  onChange={(e) => setFormData({ ...formData, maxPatients: e.target.value })}
                />

                <Input
                  label={t('admin.maxStorageGBOptional')}
                  type='number'
                  value={formData.maxStorageGB}
                  onChange={(e) => setFormData({ ...formData, maxStorageGB: e.target.value })}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.descriptionOptional')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  rows={2}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-3'>
                  {t('admin.featuresLabel')}
                </label>
                <div className='border border-neutral-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-neutral-100'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {AVAILABLE_FEATURES.map((feature) => (
                      <label
                        key={feature}
                        className='flex items-center gap-3 p-2 rounded hover:bg-neutral-100 cursor-pointer'
                      >
                        <Checkbox
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
                          size='sm'
                        />
                        <span className='text-sm text-neutral-700'>{feature}</span>
                      </label>
                    ))}
                  </div>
                  {formData.features.length === 0 && (
                    <p className='text-sm text-neutral-500 mt-2 text-center'>
                      Select features to include in this plan
                    </p>
                  )}
                </div>
                {formData.features.length > 0 && (
                  <p className='text-sm text-neutral-500 mt-2'>
                    {formData.features.length} feature(s) selected
                  </p>
                )}
              </div>

              <div className='flex flex-col gap-3'>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='isPopular'
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    size='sm'
                  />
                  <label htmlFor='isPopular' className='block text-sm text-neutral-700 cursor-pointer'>
                    {t('admin.markAsPopular')}
                  </label>
                </div>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='isHidden'
                    checked={formData.isHidden}
                    onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                    size='sm'
                  />
                  <label htmlFor='isHidden' className='block text-sm text-neutral-700 cursor-pointer'>
                    {t('admin.hideFromPricing')}
                  </label>
                </div>
              </div>

              <div className='flex gap-4'>
                <Button type='submit' isLoading={submitting} disabled={submitting}>
                  {editingPlanId ? t('admin.updatePlan') : t('admin.createPlan')}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card>
          {plans.length === 0 ? (
            <div className='p-8 text-center'>
              <p className='text-neutral-500 mb-4'>{t('admin.noSubscriptionPlans')}</p>
              <Button onClick={() => fetchPlans(true)} variant='secondary'>
                {t('common.refresh')}
              </Button>
            </div>
          ) : viewMode === VIEW_CARDS ? (
            <>
              <div className='p-4 border-b border-neutral-200'>
                <p className='text-sm text-neutral-600'>
                  {(t('admin.showingPlans') || 'Showing {{count}} subscription plan(s)').replace(
                    '{{count}}',
                    String(plans.length),
                  )}
                </p>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4'>
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    className='rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 flex flex-col'
                  >
                    <div className='flex items-start justify-between gap-2 mb-2'>
                      <div>
                        <h3 className='font-semibold text-neutral-900'>{plan.name}</h3>
                        <p className='text-xs text-neutral-500 font-mono mt-0.5'>ID: {plan._id}</p>
                      </div>
                      <ActionsMenu
                        ariaLabel={t('common.actions')}
                        triggerSize='xs'
                        items={[
                          {
                            key: 'edit',
                            label: t('common.edit'),
                            icon: <PencilIcon className='icon icon-sm' />,
                            onClick: () => handleEdit(plan),
                          },
                          {
                            key: 'copy',
                            label: t('admin.copyPlanId'),
                            icon: <DocumentIcon className='icon icon-sm' />,
                            onClick: () => {
                              navigator.clipboard.writeText(plan._id);
                              showSuccess(t('admin.planIdCopied'));
                            },
                          },
                        ]}
                      />
                    </div>
                    <div className='mt-2'>
                      <p className='text-lg font-bold text-neutral-900'>
                        {formatPrice(plan.price, plan.currency)}
                        <span className='text-neutral-500 text-sm font-normal ml-1'>
                          /{plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                        </span>
                      </p>
                    </div>
                    <div className='flex gap-2 mt-2'>
                      {plan.isPopular && (
                        <Tag variant='success' size='sm'>
                          {t('admin.popular')}
                        </Tag>
                      )}
                      {plan.isHidden && (
                        <Tag variant='default' size='sm'>
                          {t('admin.hidden')}
                        </Tag>
                      )}
                    </div>
                    <p className='text-sm text-neutral-600 mt-2'>
                      {(t('admin.featuresCount') || '{{count}} features').replace(
                        '{{count}}',
                        String((plan.features || []).length),
                      )}
                    </p>
                    <div className='text-sm text-neutral-500 mt-2'>
                      {plan.maxUsers != null && <div>Users: {plan.maxUsers}</div>}
                      {plan.maxPatients != null && (
                        <div>Patients: {Number(plan.maxPatients).toLocaleString()}</div>
                      )}
                      {plan.maxStorageGB != null && <div>Storage: {plan.maxStorageGB}GB</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className='p-4 border-b border-neutral-200'>
                <p className='text-sm text-neutral-600'>
                  {(t('admin.showingPlans') || 'Showing {{count}} subscription plan(s)').replace(
                    '{{count}}',
                    String(plans.length),
                  )}
                </p>
              </div>
              <Table
                data={plans}
                columns={columns}
                emptyMessage={t('admin.noSubscriptionPlans')}
              />
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
