'use client';

import { AdminToolbar } from '@/components/admin/AdminToolbar';
import {
  EyeIcon,
  FileDownIcon,
  FilterIcon,
  HistoryIcon,
  KeyIcon,
  LogOutIcon,
  RefreshCwIcon,
  UnlockIcon,
  UserAddIcon,
  XIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState(() => searchParams.get('tenantId') || '');
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedRole, setAdvancedRole] = useState('');
  const [advancedActive, setAdvancedActive] = useState('');
  const [advancedTenant, setAdvancedTenant] = useState('');
  const [detailsUser, setDetailsUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forceLogoutUserId, setForceLogoutUserId] = useState(null);
  const [unlockingUserId, setUnlockingUserId] = useState(null);

  useEffect(() => {
    const tid = searchParams.get('tenantId') || '';
    if (tid && tenantFilter !== tid) setTenantFilter(tid);
  }, [searchParams, tenantFilter]);

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

  const filtersChangedRef = useRef(false);
  const prevFiltersRef = useRef({
    debouncedSearchTerm: '',
    roleFilter: '',
    activeFilter: '',
    tenantFilter: '',
  });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.roleFilter !== roleFilter ||
      prev.activeFilter !== activeFilter ||
      prev.tenantFilter !== tenantFilter;
    if (filtersChanged) {
      prevFiltersRef.current = {
        debouncedSearchTerm,
        roleFilter,
        activeFilter,
        tenantFilter,
      };
      filtersChangedRef.current = true;
      setPagination((p) => ({ ...p, page: 1 }));
    }
  }, [debouncedSearchTerm, roleFilter, activeFilter, tenantFilter]);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      const pageToUse = filtersChangedRef.current ? 1 : pagination.page;
      if (filtersChangedRef.current) filtersChangedRef.current = false;
      fetchUsers(pageToUse);
    }
  }, [pagination.page, roleFilter, activeFilter, tenantFilter, debouncedSearchTerm]);

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

  const fetchUsers = async (pageOverride) => {
    try {
      setLoading(true);
      const page = pageOverride ?? pagination.page;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearchTerm?.trim()) params.append('search', debouncedSearchTerm.trim());
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

  /** When API receives search param, backend filters; when not, we still filter locally for consistency. */
  const filteredUsers = users.filter((u) => {
    if (!debouncedSearchTerm?.trim()) return true;
    const search = debouncedSearchTerm.trim().toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.tenantName?.toLowerCase().includes(search)
    );
  });

  const handleExportCSV = useCallback(() => {
    const headers = [
      t('auth.email'),
      t('auth.firstName'),
      t('auth.lastName'),
      t('common.role'),
      t('admin.tenant'),
      t('admin.status'),
      t('admin.lastLogin'),
      t('admin.created'),
    ];
    const rows = (filteredUsers || []).map((u) => [
      u.email || '',
      u.firstName || '',
      u.lastName || '',
      u.role || '',
      u.tenantName || '',
      u.isActive ? t('common.active') : t('common.inactive'),
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : t('common.never'),
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess(t('admin.exportSuccessful') || 'Export successful');
  }, [filteredUsers, t]);

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !resetPasswordValue?.trim() || resetPasswordValue.length < 8) {
      showError(t('admin.passwordMinLength') || 'Password must be at least 8 characters');
      return;
    }
    const userId = resetPasswordUser._id || resetPasswordUser.id;
    if (!userId) return;
    setResettingPassword(true);
    try {
      const response = await apiClient.post(`/admin/users/${userId}/reset-password`, {
        newPassword: resetPasswordValue.trim(),
      });
      if (response?.success) {
        showSuccess(t('admin.passwordResetSuccess') || 'Password reset successfully');
        setResetPasswordUser(null);
        setResetPasswordValue('');
      } else {
        showError(response?.error?.message || t('admin.passwordResetFailed'));
      }
    } catch (err) {
      logger.error('Reset password failed', err);
      showError(t('admin.passwordResetFailed') || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleUnlockAccount = async (userId) => {
    setUnlockingUserId(userId);
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, {
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      if (response?.success) {
        showSuccess(t('admin.accountUnlocked') || 'Account unlocked. User can now log in.');
        fetchUsers();
      } else {
        showError(
          response?.error?.message || t('admin.accountUnlockFailed') || 'Failed to unlock account',
        );
      }
    } catch (error) {
      logger.error('Unlock account failed:', error);
      showError(t('admin.accountUnlockFailed') || 'Failed to unlock account');
    } finally {
      setUnlockingUserId(null);
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

  const handleForceLogout = async (userId) => {
    setForceLogoutUserId(userId);
    try {
      const response = await apiClient.post(`/admin/users/${userId}/force-logout`);
      if (response?.success) {
        showSuccess(t('admin.forceLogoutSuccess') || 'All sessions revoked for this user');
      } else {
        showError(response?.error?.message || t('admin.forceLogoutFailed'));
      }
    } catch (error) {
      logger.error('Force logout failed:', error);
      showError(t('admin.forceLogoutFailed') || 'Failed to revoke sessions');
    } finally {
      setForceLogoutUserId(null);
    }
  };

  if (authLoading || loading) {
    return <Layout loading />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  const tableColumns = [
    {
      header: t('auth.email'),
      accessor: (row) => (
        <div>
          <div className='font-medium text-neutral-900 dark:text-neutral-100'>{row.email}</div>
          <div className='text-sm text-neutral-500 dark:text-neutral-400'>
            {row.firstName} {row.lastName}
          </div>
        </div>
      ),
    },
    {
      header: t('common.role'),
      accessor: (row) => (
        <span className='admin-users-role-badge px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-white capitalize'>
          {row.role?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: t('admin.tenant'),
      accessor: (row) => (
        <div>
          <div className='font-medium text-neutral-900 dark:text-neutral-100'>{row.tenantName || 'N/A'}</div>
          {row.tenantSlug && <div className='text-sm text-neutral-500 dark:text-neutral-400'>{row.tenantSlug}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.isActive
              ? 'bg-secondary-100 text-secondary-700 dark:bg-green-900/40 dark:text-white'
              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
          }`}
        >
          {row.isActive ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      header: t('admin.lastLogin'),
      accessor: (row) => (
        <div className='text-sm text-neutral-600 dark:text-neutral-300'>
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : t('common.never')}
        </div>
      ),
    },
    {
      header: t('admin.created'),
      accessor: (row) => (
        <div className='text-sm text-neutral-600 dark:text-neutral-300'>
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <div className='admin-users-actions-cell flex items-center gap-1'>
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              setDetailsUser(row);
            }}
            aria-label={t('common.view')}
            title={t('common.view')}
          >
            <EyeIcon className='icon icon-sm' />
          </Button>
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            href={`/admin/activity-logs?userId=${row._id || row.id}`}
            aria-label={t('admin.viewActivityLog') || 'View activity log'}
            title={t('admin.viewActivityLog') || 'View activity log'}
          >
            <HistoryIcon className='icon icon-sm' />
          </Button>
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              setResetPasswordUser(row);
              setResetPasswordValue('');
            }}
            aria-label={t('admin.resetPassword')}
            title={t('admin.resetPassword')}
          >
            <KeyIcon className='icon icon-sm' />
          </Button>
          {/* Unlock: shown for locked/inactive accounts */}
          {!row.isActive && (
            <Button
              variant='ghost'
              size='xs'
              iconOnly
              disabled={unlockingUserId === (row._id || row.id)}
              onClick={(e) => {
                e.stopPropagation();
                handleUnlockAccount(row._id || row.id);
              }}
              aria-label={t('admin.unlockAccount') || 'Unlock account'}
              title={t('admin.unlockAccount') || 'Unlock — re-enable this account'}
              className='text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
            >
              {unlockingUserId === (row._id || row.id) ? (
                <RefreshCwIcon className='icon icon-sm animate-spin' />
              ) : (
                <UnlockIcon className='icon icon-sm' />
              )}
            </Button>
          )}
          <Button
            variant='ghost'
            size='xs'
            iconOnly
            disabled={forceLogoutUserId === (row._id || row.id)}
            onClick={(e) => {
              e.stopPropagation();
              handleForceLogout(row._id || row.id);
            }}
            aria-label={t('admin.forceLogout') || 'Force logout'}
            title={t('admin.forceLogout') || 'Revoke all sessions'}
          >
            {forceLogoutUserId === (row._id || row.id) ? (
              <RefreshCwIcon className='icon icon-sm animate-spin' />
            ) : (
              <LogOutIcon className='icon icon-sm' />
            )}
          </Button>
          <Button
            variant={row.isActive ? 'danger' : 'primary'}
            size='xs'
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row._id || row.id, row.isActive);
            }}
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
              <XIcon className='icon icon-sm' />
            ) : (
              <UserAddIcon className='icon icon-sm' />
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
        <AdminToolbar
          intro={
            t('admin.userGovernanceIntro') ||
            'Control access without entering clinic: reset password, unlock (activate), force logout. View user list and last login. Login history: use Activity log link per user. Failed attempts: see Security tab and Audit & Compliance.'
          }
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder={t('admin.searchUsersPlaceholder')}
          searchAriaLabel={t('admin.searchUsersPlaceholder') || 'Search users'}
          filters={[]}
          actions={
            <>
              <Button variant='secondary' size='sm' onClick={handleExportCSV}>
                <FileDownIcon className='icon icon-sm flex-shrink-0' ariaHidden />
                {t('admin.exportCSV') || 'Export CSV'}
              </Button>
              <Button
                variant='secondary'
                size='sm'
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
            </>
          }
        />

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
                <option value=''>{t('admin.allRoles')}</option>
                <option value='clinic_admin'>{t('admin.roleClinicAdmin')}</option>
                <option value='doctor'>{t('common.roleDoctor')}</option>
                <option value='nurse'>{t('admin.roleNurse')}</option>
                <option value='receptionist'>{t('admin.roleReceptionist')}</option>
                <option value='accountant'>{t('admin.roleAccountant')}</option>
                <option value='pharmacist'>{t('admin.rolePharmacist')}</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label>{t('common.status') || 'Status'}</label>
              <select
                className='filter-select w-full'
                value={advancedActive}
                onChange={(e) => setAdvancedActive(e.target.value)}
              >
                <option value=''>{t('common.all')}</option>
                <option value='true'>{t('common.active')}</option>
                <option value='false'>{t('common.inactive')}</option>
              </select>
            </div>
            <div className='search-modal-field full-width'>
              <label>{t('admin.tenant') || 'Tenant'}</label>
              <select
                className='filter-select w-full'
                value={advancedTenant}
                onChange={(e) => setAdvancedTenant(e.target.value)}
              >
                <option value=''>{t('admin.allTenants')}</option>
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

        {/* User Details Modal */}
        {detailsUser && (
          <Modal
            isOpen={!!detailsUser}
            onClose={() => setDetailsUser(null)}
            title={t('admin.userDetails') || 'User Details'}
          >
            <div className='space-y-3 text-sm'>
              <div>
                <span className='font-medium text-neutral-500'>{t('common.email')}: </span>
                {detailsUser.email}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>{t('admin.clientName')}: </span>
                {detailsUser.firstName} {detailsUser.lastName}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>{t('admin.role')}: </span>
                {detailsUser.role?.replace('_', ' ')}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>{t('admin.tenant')}: </span>
                {detailsUser.tenantName || 'N/A'}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>{t('admin.status')}: </span>
                {detailsUser.isActive ? t('admin.active') : t('admin.inactive')}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>
                  {t('admin.lastLogin') || 'Last Login'}:{' '}
                </span>
                {detailsUser.lastLoginAt
                  ? new Date(detailsUser.lastLoginAt).toLocaleString()
                  : 'Never'}
              </div>
              <div>
                <span className='font-medium text-neutral-500'>{t('admin.created')}: </span>
                {detailsUser.createdAt ? new Date(detailsUser.createdAt).toLocaleString() : '-'}
              </div>
              <div className='pt-3 border-t'>
                <Button
                  variant='secondary'
                  size='sm'
                  href={`/admin/activity-logs?userId=${detailsUser._id || detailsUser.id}`}
                >
                  <HistoryIcon className='icon icon-sm flex-shrink-0' ariaHidden />
                  {t('admin.viewActivityLog') || 'View activity log'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Reset Password Modal */}
        {resetPasswordUser && (
          <Modal
            isOpen={!!resetPasswordUser}
            onClose={() => {
              setResetPasswordUser(null);
              setResetPasswordValue('');
            }}
            title={t('admin.resetPassword') || 'Reset Password'}
          >
            <div className='space-y-4'>
              <p className='text-sm text-neutral-600'>
                {t('admin.resetPasswordFor') || 'Reset password for'}:{' '}
                <strong>{resetPasswordUser.email}</strong>
              </p>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  {t('admin.newPassword') || 'New Password'}
                </label>
                <input
                  type='password'
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder={t('admin.passwordMinLength') || 'Min 8 characters'}
                  className='form-control-height w-full border rounded-lg px-3'
                  minLength={8}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleResetPassword}
                  disabled={
                    !resetPasswordValue?.trim() ||
                    resetPasswordValue.length < 8 ||
                    resettingPassword
                  }
                  isLoading={resettingPassword}
                >
                  {t('admin.resetPassword')}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => {
                    setResetPasswordUser(null);
                    setResetPasswordValue('');
                  }}
                  disabled={resettingPassword}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
