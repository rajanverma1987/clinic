'use client';

import { FilterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiClient } from '@/lib/api/client';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { getRolePermissions } from '@/lib/permissions/constants';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'clinic_admin', labelKey: 'settings.admin' },
  { value: 'manager', labelKey: 'settings.manager' },
  { value: 'nurse', labelKey: 'settings.nurse' },
  { value: 'receptionist', labelKey: 'settings.receptionist' },
  { value: 'accountant', labelKey: 'settings.accountant' },
  { value: 'pharmacist', labelKey: 'settings.pharmacist' },
  { value: 'lab_tech', labelKey: 'staff.labTech' },
];

function permissionsSummary(role) {
  if (!role) return '—';
  const perms = getRolePermissions(role);
  if (!perms || typeof perms !== 'object') return '—';
  const keys = Object.keys(perms).slice(0, 4);
  return (
    keys.map((k) => k.replace(/_/g, ' ')).join(', ') + (Object.keys(perms).length > 4 ? '…' : '')
  );
}

export default function StaffPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedRole, setAdvancedRole] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'receptionist',
    sendWelcomeEmail: true,
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  const allowedRoles = ['doctor', 'clinic_admin'];

  const fetchStaff = useCallback(async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      const res = await apiClient.get('/users');
      if (res?.success && res?.data) {
        const data = res.data?.data ?? res.data;
        setStaff(extractArrayData({ data }) ?? []);
      } else {
        setStaff([]);
      }
    } catch (err) {
      logger.error('Failed to fetch staff', err);
      setStaff([]);
    } finally {
      if (!silentRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchStaff();
  }, [authLoading, user, router, fetchStaff]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (
      !authLoading &&
      user &&
      allowedRoles.includes(user.role) &&
      !debouncedSearchTerm &&
      !roleFilter
    ) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchStaff(true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, debouncedSearchTerm, roleFilter, fetchStaff]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff(false);
  }, [fetchStaff]);

  const filteredStaff = staff.filter((s) => {
    if (debouncedSearchTerm) {
      const q = debouncedSearchTerm.toLowerCase();
      if (
        !(s.firstName || '').toLowerCase().includes(q) &&
        !(s.lastName || '').toLowerCase().includes(q) &&
        !(s.email || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (roleFilter && s.role !== roleFilter) return false;
    return true;
  });

  const openConfirm = useConfirmation().open;
  const handleDeactivate = async (row) => {
    openConfirm({
      title: t('staff.confirmDeactivate'),
      message: t('common.confirmationDescription'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.put(`/users/${row.id}`, { isActive: false });
          if (res?.success) {
            showSuccess(row.isActive ? t('staff.deactivate') + ' OK' : t('staff.activate') + ' OK');
            fetchStaff();
          } else {
            showError(res?.error?.message || 'Failed to update');
          }
        } catch (err) {
          showError(err?.message || 'Failed to update');
        }
      },
    });
  };

  const handleActivate = async (row) => {
    try {
      const res = await apiClient.put(`/users/${row.id}`, { isActive: true });
      if (res?.success) {
        showSuccess(t('staff.activate') + ' OK');
        fetchStaff();
      } else {
        showError(res?.error?.message || 'Failed to update');
      }
    } catch (err) {
      showError(err?.message || 'Failed to update');
    }
  };

  const handleRemove = async (row) => {
    openConfirm({
      title: t('staff.confirmRemove'),
      message: t('common.confirmationDescription'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await apiClient.delete(`/users/${row.id}`);
          if (res?.success) {
            showSuccess(t('staff.userRemoved'));
            fetchStaff();
          } else {
            showError(res?.error?.message || 'Failed to remove');
          }
        } catch (err) {
          showError(err?.message || 'Failed to remove');
        }
      },
    });
  };

  const openEdit = (row) => {
    setEditingUser(row);
    setEditForm({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      role: row.role || '',
      isActive: row.isActive !== false,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser?.id) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/users/${editingUser.id}`, editForm);
      if (res?.success) {
        showSuccess(t('common.update') + ' OK');
        setEditingUser(null);
        fetchStaff();
      } else {
        showError(res?.error?.message || 'Failed to update');
      }
    } catch (err) {
      showError(err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.firstName?.trim() || !addForm.lastName?.trim() || !addForm.email?.trim()) {
      showError(t('staff.fullName') + ' & ' + t('staff.email') + ' required');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post('/users/register-staff', {
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone?.trim() || undefined,
        role: addForm.role,
        sendWelcomeEmail: addForm.sendWelcomeEmail,
        requirePasswordChange: true,
      });
      if (res?.success) {
        showSuccess(t('staff.invitationSent'));
        setShowAddModal(false);
        setAddForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'receptionist',
          sendWelcomeEmail: true,
        });
        fetchStaff();
      } else {
        showError(res?.error?.message || res?.data?.message || 'Failed to add staff');
      }
    } catch (err) {
      showError(err?.message || 'Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <Loader type='page' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  const columns = [
    {
      header: t('staff.fullName'),
      accessor: (row) => (
        <div className='font-medium text-neutral-900'>
          {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
        </div>
      ),
    },
    {
      header: t('staff.email'),
      accessor: (row) => <div className='text-neutral-700'>{row.email || '—'}</div>,
    },
    {
      header: t('staff.phone'),
      accessor: (row) => <div className='text-neutral-600'>{row.phone || '—'}</div>,
    },
    {
      header: t('staff.role'),
      headerClassName: 'min-w-[8rem]',
      cellClassName: 'min-w-[8rem]',
      accessor: (row) => {
        const role = row.role ?? row.roles?.[0] ?? '';
        const label = typeof role === 'string' ? role.replace(/_/g, ' ') : String(role);
        return (
          <span
            className='inline-block min-w-[7rem] px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 capitalize whitespace-nowrap'
            title={label}
          >
            {label || '—'}
          </span>
        );
      },
    },
    {
      header: t('staff.permissions'),
      accessor: (row) => (
        <span className='text-xs text-neutral-500' title={permissionsSummary(row.role)}>
          {permissionsSummary(row.role)}
        </span>
      ),
    },
    {
      header: t('common.status'),
      accessor: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {row.isActive ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      header: t('staff.lastLogin'),
      accessor: (row) => (
        <span className='text-sm text-neutral-600'>
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : t('staff.never')}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <div className='flex gap-2 flex-wrap'>
          <Button variant='secondary' size='sm' onClick={() => openEdit(row)}>
            {t('staff.edit')}
          </Button>
          {row.isActive ? (
            <Button variant='secondary' size='sm' onClick={() => handleDeactivate(row)}>
              {t('staff.deactivate')}
            </Button>
          ) : (
            <Button variant='secondary' size='sm' onClick={() => handleActivate(row)}>
              {t('staff.activate')}
            </Button>
          )}
          <Button
            variant='ghost'
            size='sm'
            className='text-red-600'
            onClick={() => handleRemove(row)}
          >
            {t('staff.remove')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title={t('staff.title')}
        subtitle={t('staff.subtitle')}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        action={
          <Button variant='primary' onClick={() => setShowAddModal(true)}>
            {t('staff.addStaff')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <PageSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={() => {}}
          placeholder={t('staff.searchPlaceholder')}
        >
          <Button
            variant='secondary'
            size='md'
            onClick={() => {
              setAdvancedRole(roleFilter);
              setShowAdvancedSearch(true);
            }}
          >
            <FilterIcon className='icon icon-sm' aria-hidden />
            {t('staff.advancedSearch')}
          </Button>
        </PageSearchBar>

        {showAdvancedSearch && (
          <Modal
            isOpen={showAdvancedSearch}
            onClose={() => setShowAdvancedSearch(false)}
            title={t('staff.advancedSearch')}
            size='sm'
            contentClassName='Modal-content--compact'
          >
            <div className='search-modal-grid'>
              <div className='search-modal-field'>
                <select
                  className='filter-select w-full'
                  value={advancedRole}
                  onChange={(e) => setAdvancedRole(e.target.value)}
                  aria-label={t('staff.role')}
                >
                  <option value=''>{t('staff.role')}</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
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
                  setShowAdvancedSearch(false);
                }}
              >
                {t('admin.applyFilters')}
              </Button>
            </div>
          </Modal>
        )}

        <Card>
          <div className='p-4'>
            <div className='mb-4 text-sm text-neutral-600'>
              {t('common.total')}: {filteredStaff.length}
            </div>
            <Table
              data={filteredStaff}
              columns={columns}
              loading={loading}
              emptyMessage={t('staff.noStaffFound')}
            />
          </div>
        </Card>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <Card className='p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>{t('staff.addStaff')}</h2>
              <form onSubmit={handleAddSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.fullName')} *
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    <Input
                      placeholder='First'
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      required
                    />
                    <Input
                      placeholder='Last'
                      value={addForm.lastName}
                      onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.email')} *
                  </label>
                  <Input
                    type='email'
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.phone')}
                  </label>
                  <Input
                    type='tel'
                    placeholder='+1 234 567 8900'
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.role')} *
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='sendWelcome'
                    checked={addForm.sendWelcomeEmail}
                    onChange={(e) => setAddForm({ ...addForm, sendWelcomeEmail: e.target.checked })}
                  />
                  <label htmlFor='sendWelcome' className='text-sm text-neutral-700'>
                    {t('staff.sendInvitation')} (email with login link)
                  </label>
                </div>
                <div className='flex justify-end gap-2 pt-4'>
                  <Button type='button' variant='secondary' onClick={() => setShowAddModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type='submit' variant='primary' disabled={saving}>
                    {saving ? t('common.loading') : t('staff.sendInvitation')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <Card className='p-6 max-w-md w-full'>
              <h2 className='text-lg font-bold text-neutral-900 mb-4'>
                {t('staff.edit')} – {editingUser.email}
              </h2>
              <form onSubmit={handleEditSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      First name
                    </label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-1'>
                      Last name
                    </label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.role')}
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='editActive'
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  <label htmlFor='editActive' className='text-sm text-neutral-700'>
                    {t('common.active')}
                  </label>
                </div>
                <div className='flex justify-end gap-2 pt-4'>
                  <Button type='button' variant='secondary' onClick={() => setEditingUser(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type='submit' variant='primary' disabled={saving}>
                    {saving ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
