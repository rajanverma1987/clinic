'use client';

import { FilterIcon, UserAddIcon, XIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedRole, setAdvancedRole] = useState('');
  const [advancedActive, setAdvancedActive] = useState('');
  const [advancedTenant, setAdvancedTenant] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchTenants();
      fetchUsers();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers();
    }
  }, [pagination.page, roleFilter, activeFilter, tenantFilter]);

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/admin/clients');
      if (response.success && response.data) {
        setTenants(extractArrayData(response));
      }
    } catch (error) {
      logger.error('Failed to fetch tenants:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (roleFilter) params.append('role', roleFilter);
      if (activeFilter) params.append('isActive', activeFilter);
      if (tenantFilter) params.append('tenantId', tenantFilter);

      const response = await apiClient.get(`/admin/users?${params.toString()}`);

      if (response.success && response.data) {
        setUsers(extractArrayData(response));
        setPagination(extractPaginationData(response));
      }
    } catch (error) {
      logger.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      if (response?.success) {
        showSuccess(currentStatus ? 'User deactivated' : 'User activated');
        fetchUsers();
      } else {
        showError(response?.error?.message || 'Failed to update user status');
      }
    } catch (error) {
      logger.error('Failed to toggle user status:', error);
      showError(t('admin.failedToUpdateUserStatus'));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!debouncedSearchTerm) return true;
    const search = debouncedSearchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.tenantName?.toLowerCase().includes(search)
    );
  });

  if (authLoading || loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  const tableColumns = [
    {
      header: 'Email',
      accessor: (row) => (
        <div>
          <div className='font-medium text-neutral-900'>{row.email}</div>
          <div className='text-sm text-neutral-500'>
            {row.firstName} {row.lastName}
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => (
        <span className='px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 capitalize'>
          {row.role?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Tenant',
      accessor: (row) => (
        <div>
          <div className='font-medium text-neutral-900'>{row.tenantName || 'N/A'}</div>
          {row.tenantSlug && <div className='text-sm text-neutral-500'>{row.tenantSlug}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.isActive ? 'bg-secondary-100 text-secondary-700' : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessor: (row) => (
        <div className='text-sm text-neutral-600'>
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: (row) => (
        <div className='text-sm text-neutral-600'>
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className='flex items-center gap-1'>
          <Button
            variant={row.isActive ? 'danger' : 'primary'}
            size='xs'
            iconOnly
            onClick={() => handleToggleActive(row.id, row.isActive)}
            aria-label={
              row.isActive
                ? t('admin.deactivate') || 'Deactivate'
                : t('admin.activate') || 'Activate'
            }
            title={
              row.isActive
                ? t('admin.deactivate') || 'Deactivate'
                : t('admin.activate') || 'Activate'
            }
          >
            {row.isActive ? (
              <XIcon className='icon icon-xs' />
            ) : (
              <UserAddIcon className='icon icon-xs' />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout
      title={t('admin.allUsersManagement')}
      subtitle={t('admin.allUsersDescription')}
      actionButton={
        <Button variant='secondary' size='xs' href='/admin/activity-logs'>
          {t('admin.activityLogs')}
        </Button>
      }
    >
      <div className='admin-page-content'>
        <PageSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={() => setPagination((p) => ({ ...p, page: 1 }))}
          placeholder={t('admin.searchUsersPlaceholder')}
        >
          <Button
            variant='secondary'
            size='md'
            onClick={() => {
              setAdvancedRole(roleFilter);
              setAdvancedActive(activeFilter);
              setAdvancedTenant(tenantFilter);
              setShowAdvancedSearch(true);
            }}
          >
            <FilterIcon className='icon icon-sm' aria-hidden />
            {t('admin.patientsAdvancedSearch')}
          </Button>
        </PageSearchBar>

        <Modal
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          title={t('admin.patientsAdvancedSearch')}
          size='sm'
          contentClassName='Modal-content--compact'
        >
          <div className='search-modal-grid'>
            <div className='search-modal-field'>
              <label>{t('admin.role') || 'Role'}</label>
              <select
                className='filter-select w-full'
                value={advancedRole}
                onChange={(e) => setAdvancedRole(e.target.value)}
              >
                <option value=''>All Roles</option>
                <option value='clinic_admin'>Clinic Admin</option>
                <option value='doctor'>Doctor</option>
                <option value='nurse'>Nurse</option>
                <option value='receptionist'>Receptionist</option>
                <option value='accountant'>Accountant</option>
                <option value='pharmacist'>Pharmacist</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label>{t('common.status') || 'Status'}</label>
              <select
                className='filter-select w-full'
                value={advancedActive}
                onChange={(e) => setAdvancedActive(e.target.value)}
              >
                <option value=''>All</option>
                <option value='true'>Active</option>
                <option value='false'>Inactive</option>
              </select>
            </div>
            <div className='search-modal-field full-width'>
              <label>{t('admin.tenant') || 'Tenant'}</label>
              <select
                className='filter-select w-full'
                value={advancedTenant}
                onChange={(e) => setAdvancedTenant(e.target.value)}
              >
                <option value=''>All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className='search-modal-footer'>
            <Button variant='secondary' onClick={() => setShowAdvancedSearch(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant='primary'
              onClick={() => {
                setRoleFilter(advancedRole);
                setActiveFilter(advancedActive);
                setTenantFilter(advancedTenant);
                setPagination((p) => ({ ...p, page: 1 }));
                setShowAdvancedSearch(false);
              }}
            >
              {t('admin.applyFilters')}
            </Button>
          </div>
        </Modal>

        {/* Users Table */}
        <Card>
          <div className='p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-body-md font-semibold text-neutral-900'>
                Users ({pagination.total})
              </h2>
            </div>
            <Table
              data={filteredUsers}
              columns={tableColumns}
              loading={loading}
              emptyMessage={t('admin.noUsersFound')}
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className='mt-4 flex items-center justify-between gap-3'>
                <div className='text-body-sm text-neutral-600'>
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='secondary'
                    size='xs'
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='secondary'
                    size='xs'
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
