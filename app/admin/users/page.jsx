'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { showError, showSuccess } from '@/lib/utils/toast';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

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
      showError('Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
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
          <div className='text-sm text-neutral-500'>{row.firstName} {row.lastName}</div>
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
          {row.tenantSlug && (
            <div className='text-sm text-neutral-500'>{row.tenantSlug}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.isActive
              ? 'bg-secondary-100 text-secondary-700'
              : 'bg-neutral-100 text-neutral-700'
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
          {row.lastLoginAt
            ? new Date(row.lastLoginAt).toLocaleDateString()
            : 'Never'}
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
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => handleToggleActive(row.id, row.isActive)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
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
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => router.push('/admin/activity-logs')}>
            Activity logs
          </Button>
          <Button variant='primary' onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 10px' }}>

        {/* Filters */}
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Search
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.searchUsersPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Role
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
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
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Status
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                >
                  <option value=''>All</option>
                  <option value='true'>Active</option>
                  <option value='false'>Inactive</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Tenant
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={tenantFilter}
                  onChange={(e) => {
                    setTenantFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
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
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-neutral-900'>
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
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-neutral-600'>
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
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

