'use client';

import {
  BellIcon,
  EyeIcon,
  FileDownIcon,
  PencilIcon,
  TrashIcon,
  UserAddIcon,
  UserIcon,
  UsersIcon,
  WarningIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT } from '@/lib/constants/subscription-spec';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function AdminClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [planFilter, setPlanFilter] = useState(() => searchParams.get('plan') || '');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsClient, setDetailsClient] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendClient, setSuspendClient] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyClient, setNotifyClient] = useState(null);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);

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

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) setPlanFilter(plan);
  }, [searchParams]);

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
        const available = plansData.filter(
          (p) =>
            p &&
            p.name &&
            p.status === 'ACTIVE' &&
            p.isHidden !== true &&
            AVAILABLE_PLAN_NAMES_FOR_ASSIGNMENT.some(
              (n) => n.toLowerCase() === (p.name || '').toLowerCase(),
            ),
        );
        setPlans(available);
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

  const filteredClients = useMemo(() => {
    let list = [...(clients || [])];
    if (searchTerm?.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.slug || '').toLowerCase().includes(q) ||
          (c.region || '').toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'active') list = list.filter((c) => c.isActive === true && !c.suspended);
    else if (statusFilter === 'inactive') list = list.filter((c) => c.isActive === false);
    else if (statusFilter === 'suspended') list = list.filter((c) => c.suspended === true);
    if (regionFilter) list = list.filter((c) => c.region === regionFilter);
    if (planFilter)
      list = list.filter(
        (c) =>
          c.subscription?.planId?.name === planFilter || c.subscription?.planId?._id === planFilter,
      );
    return list;
  }, [clients, searchTerm, statusFilter, regionFilter, planFilter]);

  const regions = useMemo(() => {
    const s = new Set(clients?.map((c) => c.region).filter(Boolean) || []);
    return Array.from(s).sort();
  }, [clients]);

  const planNames = useMemo(() => {
    const s = new Set(clients?.map((c) => c.subscription?.planId?.name).filter(Boolean) || []);
    return Array.from(s).sort();
  }, [clients]);

  const handleViewDetails = async (client) => {
    setDetailsClient(client);
    setShowDetailsModal(true);
    setUsageStats(null);
    try {
      const res = await apiClient.get(`/admin/clients/${client._id}/usage`);
      if (res.success && res.data) setUsageStats(res.data);
    } catch {
      // Ignore
    }
  };

  const handleSuspend = (client) => {
    setSuspendClient(client);
    setSuspendReason(client.suspendReason || '');
    setShowSuspendModal(true);
  };

  const handleSubmitSuspend = async () => {
    if (!suspendClient) return;
    try {
      const res = await apiClient.put(`/admin/clients/${suspendClient._id}`, {
        suspended: true,
        suspendReason: suspendReason.trim() || undefined,
      });
      if (res.success) {
        showSuccess(t('admin.clinicSuspended') || 'Clinic suspended successfully');
        setShowSuspendModal(false);
        setSuspendClient(null);
        setSuspendReason('');
        fetchClients();
      } else {
        showError(res.error?.message || t('admin.suspendFailed'));
      }
    } catch (err) {
      showError(err.message || t('admin.suspendFailed'));
    }
  };

  const handleUnsuspend = async (client) => {
    openConfirm({
      title: t('admin.unsuspendClinic') || 'Unsuspend clinic',
      message: t('admin.unsuspendConfirm') || 'Allow this clinic to log in again?',
      variant: 'default',
      onConfirm: async () => {
        try {
          const res = await apiClient.put(`/admin/clients/${client._id}`, {
            suspended: false,
          });
          if (res.success) {
            showSuccess(t('admin.clinicUnsuspended') || 'Clinic unsuspended successfully');
            fetchClients();
          } else {
            showError(res.error?.message || 'Failed');
          }
        } catch (err) {
          showError(err.message || 'Failed');
        }
      },
    });
  };

  const handleNotify = (client) => {
    setNotifyClient(client);
    setNotifyTitle('');
    setNotifyMessage('');
    setShowNotifyModal(true);
  };

  const handleSubmitNotify = async () => {
    if (!notifyClient || !notifyTitle.trim() || !notifyMessage.trim()) return;
    try {
      const res = await apiClient.post(`/admin/clients/${notifyClient._id}/notify`, {
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
      });
      if (res.success) {
        showSuccess(t('admin.notificationSent') || 'Notification sent');
        setShowNotifyModal(false);
        setNotifyClient(null);
        setNotifyTitle('');
        setNotifyMessage('');
      } else {
        showError(res.error?.message || 'Failed');
      }
    } catch (err) {
      showError(err.message || 'Failed');
    }
  };

  const handleImpersonate = async (client) => {
    try {
      const res = await apiClient.post(`/admin/clients/${client._id}/impersonate`);
      if (res.success && res.data?.redirectUrl) {
        window.open(res.data.redirectUrl, '_blank', 'noopener');
      } else {
        showError(res.error?.message || 'Failed');
      }
    } catch (err) {
      showError(err.message || 'Failed');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let suspendReasonVal = '';
    if (action === 'suspend') {
      suspendReasonVal =
        window.prompt(t('admin.suspendReasonPrompt') || 'Reason for suspension (optional):') || '';
    }
    try {
      const res = await apiClient.post('/admin/clients/bulk', {
        action,
        tenantIds: ids,
        suspendReason: suspendReasonVal.trim() || undefined,
      });
      if (res.success) {
        showSuccess(res.data?.message || 'Done');
        setSelectedIds(new Set());
        setShowBulkBar(false);
        fetchClients();
      } else {
        showError(res.error?.message || 'Failed');
      }
    } catch (err) {
      showError(err.message || 'Failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map((c) => c._id)));
    }
  };

  const handleExportCSV = useCallback(() => {
    const headers = [
      'Name',
      'Slug',
      'Region',
      'Status',
      'Plan',
      'Subscription Status',
      'Next Billing',
      'Created',
    ];
    const rows = (filteredClients || []).map((c) => [
      c.name || '',
      c.slug || '',
      c.region || '',
      c.isActive ? 'Active' : 'Inactive',
      c.subscription?.planId?.name || 'None',
      c.subscription?.status || '-',
      c.subscription?.currentPeriodEnd
        ? new Date(c.subscription.currentPeriodEnd).toLocaleDateString()
        : '-',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess(t('admin.exportSuccessful') || 'Export successful');
  }, [filteredClients, t]);

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
      header: (
        <input
          type='checkbox'
          checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
          onChange={toggleSelectAll}
          aria-label={t('common.selectAll') || 'Select all'}
        />
      ),
      accessor: (row) => (
        <input
          type='checkbox'
          checked={selectedIds.has(row._id)}
          onChange={() => toggleSelect(row._id)}
          aria-label={`Select ${row.name}`}
        />
      ),
    },
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
        <div className='flex flex-wrap gap-1'>
          {row.suspended ? (
            <Tag variant='warning'>{t('admin.suspended') || 'Suspended'}</Tag>
          ) : (
            <Tag variant={row.isActive ? 'success' : 'danger'}>
              {row.isActive ? t('admin.active') || 'Active' : t('admin.inactive') || 'Inactive'}
            </Tag>
          )}
        </div>
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
              key: 'view',
              label: t('common.view') || 'View',
              icon: <EyeIcon className='icon icon-sm' />,
              onClick: () => handleViewDetails(row),
            },
            {
              key: 'usage',
              label: t('admin.usageStats') || 'Usage stats',
              icon: <UsersIcon className='icon icon-sm' />,
              onClick: () => handleViewDetails(row),
            },
            {
              key: 'update',
              label: t('common.update') || 'Update',
              icon: <PencilIcon className='icon icon-sm' />,
              onClick: () => handleUpdateSubscription(row),
            },
            {
              key: 'impersonate',
              label: t('admin.loginAsClinic') || 'Login as clinic',
              icon: <UserIcon className='icon icon-sm' />,
              onClick: () => handleImpersonate(row),
            },
            {
              key: 'notify',
              label: t('admin.sendNotification') || 'Send notification',
              icon: <BellIcon className='icon icon-sm' />,
              onClick: () => handleNotify(row),
            },
            ...(row.suspended
              ? [
                  {
                    key: 'unsuspend',
                    label: t('admin.unsuspend') || 'Unsuspend',
                    icon: <UserAddIcon className='icon icon-sm' />,
                    onClick: () => handleUnsuspend(row),
                  },
                ]
              : [
                  {
                    key: 'suspend',
                    label: t('admin.suspend') || 'Suspend',
                    icon: <WarningIcon className='icon icon-sm' />,
                    onClick: () => handleSuspend(row),
                  },
                ]),
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
        <div className='flex flex-col sm:flex-row gap-4 mb-4'>
          <div className='flex-1 flex flex-wrap gap-2'>
            <Input
              placeholder={t('admin.searchClientsPlaceholder') || 'Search by name, slug, region...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='max-w-xs'
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              width='fit'
              options={[
                { value: '', label: t('admin.allStatuses') || 'All statuses' },
                { value: 'active', label: t('admin.active') || 'Active' },
                { value: 'inactive', label: t('admin.inactive') || 'Inactive' },
                { value: 'suspended', label: t('admin.suspended') || 'Suspended' },
              ]}
            />
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              width='fit'
              options={[
                { value: '', label: t('admin.allRegions') || 'All regions' },
                ...regions.map((r) => ({ value: r, label: r })),
              ]}
            />
            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              width='fit'
              options={[
                { value: '', label: t('admin.allPlans') || 'All plans' },
                ...planNames.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
          <Button
            variant='secondary'
            size='sm'
            onClick={handleExportCSV}
            aria-label={t('admin.exportCSV')}
          >
            <FileDownIcon className='icon icon-sm mr-1' />
            {t('admin.exportCSV') || 'Export CSV'}
          </Button>
        </div>
        {selectedIds.size > 0 && (
          <div className='mb-4 flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4'>
            <span className='text-sm font-medium'>
              {selectedIds.size} {t('common.selected') || 'selected'}
            </span>
            <div className='flex gap-2'>
              <Button variant='secondary' size='sm' onClick={() => handleBulkAction('activate')}>
                {t('admin.activate') || 'Activate'}
              </Button>
              <Button variant='secondary' size='sm' onClick={() => handleBulkAction('suspend')}>
                {t('admin.suspend') || 'Suspend'}
              </Button>
              <Button variant='danger' size='sm' onClick={() => handleBulkAction('deactivate')}>
                {t('admin.deactivate') || 'Deactivate'}
              </Button>
              <Button variant='ghost' size='sm' onClick={() => setSelectedIds(new Set())}>
                {t('common.clear') || 'Clear'}
              </Button>
            </div>
          </div>
        )}
        <Card>
          <Table
            data={filteredClients}
            columns={columns}
            emptyMessage={t('admin.noClientsFound')}
          />
        </Card>

        {/* Clinic Details Modal */}
        {showDetailsModal && detailsClient && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setDetailsClient(null);
            }}
            title={t('admin.clinicDetails') || 'Clinic Details'}
          >
            <div className='space-y-4'>
              <div>
                <p className='text-sm font-medium text-neutral-500'>
                  {t('admin.clientName') || 'Name'}
                </p>
                <p className='text-lg font-semibold'>{detailsClient.name}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-neutral-500'>{t('admin.slug') || 'Slug'}</p>
                <p className='font-mono text-sm'>{detailsClient.slug}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-neutral-500'>
                  {t('admin.region') || 'Region'}
                </p>
                <p>{detailsClient.region}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-neutral-500'>
                  {t('admin.status') || 'Status'}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {detailsClient.suspended ? (
                    <Tag variant='warning'>{t('admin.suspended') || 'Suspended'}</Tag>
                  ) : (
                    <Tag variant={detailsClient.isActive ? 'success' : 'danger'}>
                      {detailsClient.isActive ? t('admin.active') : t('admin.inactive')}
                    </Tag>
                  )}
                </div>
                {detailsClient.suspended && detailsClient.suspendReason && (
                  <p className='mt-2 text-sm text-neutral-600'>
                    {t('admin.reason') || 'Reason'}: {detailsClient.suspendReason}
                  </p>
                )}
              </div>
              {usageStats && (
                <div>
                  <p className='text-sm font-medium text-neutral-500'>
                    {t('admin.usageStats') || 'Usage stats'}
                  </p>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <span>
                      {t('patients.patients') || 'Patients'}: {usageStats.patientsCount}
                    </span>
                    <span>
                      {t('admin.managers') || 'Managers'}: {usageStats.managersCount}
                    </span>
                    <span>
                      {t('admin.staff') || 'Staff'}: {usageStats.staffCount}
                    </span>
                    <span>
                      {t('admin.appointments') || 'Appointments'}: {usageStats.appointmentsCount}
                    </span>
                  </div>
                </div>
              )}
              {detailsClient.subscription && (
                <>
                  <div>
                    <p className='text-sm font-medium text-neutral-500'>
                      {t('admin.subscriptionPlan') || 'Plan'}
                    </p>
                    <p>{detailsClient.subscription.planId?.name || '-'}</p>
                    <p className='text-sm text-neutral-500'>
                      {formatCurrency(detailsClient.subscription.planId?.price || 0)}/
                      {detailsClient.subscription.planId?.billingCycle === 'MONTHLY'
                        ? 'month'
                        : 'year'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-neutral-500'>
                      {t('admin.subscriptionStatus') || 'Subscription Status'}
                    </p>
                    <Tag
                      variant={
                        {
                          ACTIVE: 'success',
                          CANCELLED: 'danger',
                          SUSPENDED: 'warning',
                          EXPIRED: 'danger',
                          PENDING: 'warning',
                        }[detailsClient.subscription.status] || 'default'
                      }
                    >
                      {detailsClient.subscription.status}
                    </Tag>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-neutral-500'>
                      {t('admin.nextBilling') || 'Next Billing'}
                    </p>
                    <p>
                      {detailsClient.subscription.currentPeriodEnd
                        ? new Date(detailsClient.subscription.currentPeriodEnd).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className='text-sm font-medium text-neutral-500'>
                  {t('admin.created') || 'Created'}
                </p>
                <p>
                  {detailsClient.createdAt
                    ? new Date(detailsClient.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </Modal>
        )}

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
                      ...(() => {
                        const planList = [...plans];
                        const currentPlan = currentClient?.subscription?.planId;
                        if (currentPlan && !planList.some((p) => p._id === currentPlan._id)) {
                          planList.unshift(currentPlan);
                        }
                        return planList.map((plan) => ({
                          value: plan._id,
                          label: `${plan.name} - ${formatCurrency(plan.price)}/${
                            plan.billingCycle === 'MONTHLY' ? 'month' : 'year'
                          }`,
                        }));
                      })(),
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

        {/* Suspend clinic modal */}
        {showSuspendModal && suspendClient && (
          <Modal
            isOpen={showSuspendModal}
            onClose={() => {
              setShowSuspendModal(false);
              setSuspendClient(null);
              setSuspendReason('');
            }}
            title={t('admin.suspendClinic') || 'Suspend clinic'}
          >
            <div className='space-y-4'>
              <p className='text-sm text-neutral-600'>
                {t('admin.suspendClinicConfirm') ||
                  'Suspending will block all users from logging in.'}{' '}
                {suspendClient.name}
              </p>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.reason') || 'Reason'} ({t('common.optional') || 'optional'})
                </label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder={t('admin.suspendReasonPlaceholder') || 'e.g. Payment overdue'}
                />
              </div>
              <div className='flex gap-2'>
                <Button variant='danger' onClick={handleSubmitSuspend}>
                  {t('admin.suspend') || 'Suspend'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendClient(null);
                    setSuspendReason('');
                  }}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Send notification modal */}
        {showNotifyModal && notifyClient && (
          <Modal
            isOpen={showNotifyModal}
            onClose={() => {
              setShowNotifyModal(false);
              setNotifyClient(null);
              setNotifyTitle('');
              setNotifyMessage('');
            }}
            title={t('admin.sendNotification') || 'Send notification'}
          >
            <div className='space-y-4'>
              <p className='text-sm text-neutral-600'>
                {t('admin.sendNotificationTo') || 'Send to all users of'} {notifyClient.name}
              </p>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.title') || 'Title'}
                </label>
                <Input
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  placeholder={t('admin.notificationTitlePlaceholder') || 'Notification title'}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('admin.message') || 'Message'}
                </label>
                <textarea
                  className='w-full rounded-md border border-neutral-300 px-3 py-2'
                  rows={4}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder={t('admin.notificationMessagePlaceholder') || 'Message content'}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='primary'
                  onClick={handleSubmitNotify}
                  disabled={!notifyTitle.trim() || !notifyMessage.trim()}
                >
                  {t('admin.send') || 'Send'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setShowNotifyModal(false);
                    setNotifyClient(null);
                    setNotifyTitle('');
                    setNotifyMessage('');
                  }}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            </div>
          </Modal>
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
