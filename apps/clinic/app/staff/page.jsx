'use client';

import { FilterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiClient } from '@/lib/api/client';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { getRolePermissions } from '@/lib/permissions/constants';
import { getEmailDisplayValue } from '@/lib/utils/email-display';
import { getPatientDisplayNameParts } from '@/lib/utils/patient-display-name';
import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'clinic_admin', labelKey: 'settings.admin' },
  { value: 'doctor', labelKey: 'settings.doctor' },
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

/** Permission resource/action words → Spanish (for permission column display, same approach as item names) */
const PERM_WORDS_ES = {
  appointments: 'Citas', appointment: 'Cita', patients: 'Pacientes', patient: 'Paciente',
  prescriptions: 'Recetas', prescription: 'Receta', invoices: 'Facturas', invoice: 'Factura',
  payments: 'Pagos', payment: 'Pago', inventory: 'Inventario', settings: 'Ajustes',
  read: 'lectura', create: 'crear', update: 'actualizar', delete: 'eliminar',
  export: 'exportar', manage: 'gestionar', clinical_note: 'Nota clínica', clinical: 'clínica', note: 'nota',
  lab_test: 'Prueba', lab: 'Laboratorio', test: 'prueba', user: 'Usuario', users: 'Usuarios',
  report: 'Informe', reports: 'Informes', queue: 'Cola', consent: 'Consentimiento',
};

export default function StaffPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const localeCode = (i18nLocale || 'en').slice(0, 2);
  const dateLocale =
    localeCode === 'ar' ? 'ar-SA' : localeCode === 'es' ? 'es-ES' : (i18nLocale || 'en-US');

  const getDisplayValue = useCallback(
    (str, code) => {
      if (str == null || String(str).trim() === '') return '';
      const s = String(str).trim();
      const c = (code || localeCode).slice(0, 2);
      if (c === 'ar') return transliterateToArabic(s) || s;
      if (c === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
      return s;
    },
    [localeCode],
  );

  /** Full name for staff row: use stored _ar/_es when present, else transliterate/translate (same as item names). */
  const getStaffDisplayName = useCallback(
    (row) => {
      const { first, last } = getPatientDisplayNameParts(row, localeCode);
      const name = [first, last].filter(Boolean).join(' ').trim();
      return name || '—';
    },
    [localeCode],
  );

  /** Permission summary translated for locale: Arabic = transliterate, Spanish = map resource/action words. */
  const getPermissionSummaryDisplay = useCallback(
    (role) => {
      const raw = permissionsSummary(role);
      if (!raw || raw === '—') return raw;
      if (localeCode === 'ar') return transliterateToArabic(raw) || raw;
      if (localeCode === 'es') {
        const parts = raw.replace(/…$/, '').split(', ').map((phrase) =>
          phrase.split(/\s+/).map((w) => PERM_WORDS_ES[w.toLowerCase()] || w).join(' ')
        );
        const suffix = raw.endsWith('…') ? '…' : '';
        return parts.join(', ') + suffix;
      }
      return raw;
    },
    [localeCode],
  );
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
  const { limits } = useFeatures();
  const maxUsers = limits?.maxUsers;
  const currentUserCount = staff.length;
  const atUserLimit = maxUsers != null && currentUserCount >= maxUsers;

  const fetchStaff = useCallback(async (silentRefresh = false) => {
    if (!silentRefresh) setLoading(true);
    setRefreshing(true);
    try {
      const response = await apiClient.get('/users');
      const usersList = extractArrayData(response);
      setStaff(Array.isArray(usersList) ? usersList : []);
    } catch (err) {
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

  const getRoleLabel = useCallback(
    (role) => {
      const key =
        {
          clinic_admin: 'settings.admin',
          manager: 'settings.manager',
          nurse: 'settings.nurse',
          receptionist: 'settings.receptionist',
          accountant: 'settings.accountant',
          pharmacist: 'settings.pharmacist',
          lab_tech: 'staff.labTech',
          doctor: 'settings.doctor',
          super_admin: 'settings.admin',
        }[role] || null;
      return key ? t(key) : (role ? String(role).replace(/_/g, ' ') : '—');
    },
    [t],
  );

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
            showSuccess(row.isActive ? t('staff.deactivatedSuccess') : t('staff.activatedSuccess'));
            fetchStaff();
          } else {
            showError(res?.error?.message || t('staff.failedToUpdate'));
          }
        } catch (err) {
          showError(err?.message || t('staff.failedToUpdate'));
        }
      },
    });
  };

  const handleActivate = async (row) => {
    try {
      const res = await apiClient.put(`/users/${row.id}`, { isActive: true });
      if (res?.success) {
        showSuccess(t('staff.activatedSuccess'));
        fetchStaff();
      } else {
        showError(res?.error?.message || t('staff.failedToUpdate'));
      }
    } catch (err) {
      showError(err?.message || t('staff.failedToUpdate'));
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
            showError(res?.error?.message || t('staff.failedToRemove'));
          }
        } catch (err) {
          showError(err?.message || t('staff.failedToRemove'));
        }
      },
    });
  };

  const openEdit = (row) => {
    setEditingUser(row);
    const { first, last } = getPatientDisplayNameParts(row, localeCode);
    setEditForm({
      firstName: first || '',
      lastName: last || '',
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
        showSuccess(t('staff.updatedSuccess'));
        setEditingUser(null);
        fetchStaff();
      } else {
        showError(res?.error?.message || t('staff.failedToUpdate'));
      }
    } catch (err) {
      showError(err?.message || t('staff.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.firstName?.trim() || !addForm.lastName?.trim() || !addForm.email?.trim()) {
      showError(t('staff.nameAndEmailRequired'));
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
        showError(res?.error?.message || res?.data?.message || t('staff.failedToAddStaff'));
      }
    } catch (err) {
      showError(err?.message || t('staff.failedToAddStaff'));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: t('staff.fullName'),
        headerClassName: 'min-w-[11rem]',
        cellClassName: 'min-w-[11rem] align-top',
        accessor: (row) => (
          <div className='font-medium text-neutral-900 dark:text-neutral-100 break-words'>
            {[getDisplayValue(row.firstName), getDisplayValue(row.lastName)].filter(Boolean).join(' ') || '—'}
          </div>
        ),
      },
      {
        header: t('staff.email'),
        accessor: (row) => (
          <div className='text-neutral-700'>
            {row.email ? getEmailDisplayValue(row.email, localeCode) : '—'}
          </div>
        ),
      },
      {
        header: t('staff.phone'),
        accessor: (row) => (
          <div className='text-neutral-600 dark:text-neutral-300'>
            {row.phone ? getDisplayValue(row.phone) : '—'}
          </div>
        ),
      },
      {
        header: t('staff.role'),
        headerClassName: 'min-w-[8rem]',
        cellClassName: 'min-w-[8rem] align-top',
        accessor: (row) => {
          const role = row.role ?? row.roles?.[0] ?? '';
          const label = getRoleLabel(role);
          return (
            <span className='staff-table-role-badge' title={label}>
              {label || '—'}
            </span>
          );
        },
      },
      {
        header: t('staff.permissions'),
        accessor: (row) => {
          const summary = permissionsSummary(row.role);
          return (
            <span className='text-xs text-neutral-500' title={summary}>
              {summary ? getDisplayValue(summary) : '—'}
            </span>
          );
        },
      },
      {
        header: t('common.status'),
        headerClassName: 'min-w-[7rem]',
        cellClassName: 'min-w-[7rem] align-top',
        accessor: (row) => (
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              row.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
            }`}
          >
            {row.isActive ? t('common.active') : t('common.inactive')}
          </span>
        ),
      },
      {
        header: t('staff.lastLogin'),
        accessor: (row) => (
          <span className='text-sm text-neutral-600 dark:text-neutral-300'>
            {row.lastLoginAt
              ? new Date(row.lastLoginAt).toLocaleString(dateLocale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : t('staff.never')}
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
    ],
    [t, getRoleLabel, getDisplayValue, getStaffDisplayName, getPermissionSummaryDisplay, dateLocale, localeCode, openEdit],
  );

  if (authLoading) {
    return (
      <Layout>
        <Loader type='section' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <Layout>
      <PageHeader
        title={t('staff.title')}
        subtitle={t('staff.subtitle')}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        action={
          <div className='flex items-center gap-3'>
            {maxUsers != null && (
              <span
                className='text-sm text-neutral-600'
                title={t('staff.userLimitDesc')}
              >
                {currentUserCount}/{maxUsers} {t('staff.usersUsed')}
              </span>
            )}
            <Button
              variant='primary'
              onClick={() => setShowAddModal(true)}
              disabled={atUserLimit}
              title={
                atUserLimit
                  ? t('staff.upgradeToAddMore')
                  : undefined
              }
            >
              {t('staff.addStaff')}
            </Button>
          </div>
        }
      />
      <div style={{ padding: '0 10px' }} className='space-y-6'>
        <div
          className='mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg text-sm text-amber-900 dark:text-amber-200'
          role='status'
          aria-label={t('staff.disclaimerTitle')}
        >
          <p className='font-semibold mb-1'>{t('staff.disclaimerTitle')}</p>
          <p className='text-neutral-700 dark:text-neutral-300'>{t('staff.disclaimer')}</p>
        </div>
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
                {t('staff.applyFilters')}
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
              {atUserLimit && (
                <div className='mb-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg text-sm text-neutral-700'>
                  {t('staff.userLimitReached')}{' '}
                  <Link
                    href='/subscription'
                    className='text-primary-600 hover:underline font-medium'
                  >
                    {t('staff.upgradePlan')}
                  </Link>{' '}
                  {t('staff.toAddMoreUsers')}
                </div>
              )}
              <form onSubmit={handleAddSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-1'>
                    {t('staff.fullName')} *
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    <Input
                      placeholder={t('staff.placeholderFirst')}
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      required
                    />
                    <Input
                      placeholder={t('staff.placeholderLast')}
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
                    placeholder={t('staff.placeholderPhone')}
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
                    {t('staff.sendInvitation')} ({t('staff.sendInvitationHint')})
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
              <h2 className='text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4'>
                {t('staff.edit')} – {editingUser.email ? getEmailDisplayValue(editingUser.email, localeCode) : ''}
              </h2>
              <form onSubmit={handleEditSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                      {t('staff.firstName')}
                    </label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                      {t('staff.lastName')}
                    </label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                    {t('staff.role')}
                  </label>
                  <select
                    className='w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
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
                  <label htmlFor='editActive' className='text-sm text-neutral-700 dark:text-neutral-300'>
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
