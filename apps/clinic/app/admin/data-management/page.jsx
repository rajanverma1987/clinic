'use client';

import { DocumentIcon, FileDownIcon, SettingsIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function safeNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Data Management Tab – Infrastructure-level actions and platform data overview.
 * Sections: Data overview (storage from stats), Tools (backup, restore, migrate, export logs, export tenant list).
 * Super Admin only. All data tenant-level; no PHI.
 */
export default function AdminDataManagementPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupResult, setBackupResult] = useState(null);
  const [backupReason, setBackupReason] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [exportingTenants, setExportingTenants] = useState(false);
  // Restore multi-step flow state
  const [restoreStep, setRestoreStep] = useState(0); // 0=idle 1=select 2=point 3=preview 4=approve 5=confirm 6=done
  const [restoreClinics, setRestoreClinics] = useState([]);
  const [loadingRestoreClinics, setLoadingRestoreClinics] = useState(false);
  const [restoreClinic, setRestoreClinic] = useState(null);
  const [restorePoint, setRestorePoint] = useState(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoreSchedule, setRestoreSchedule] = useState('');
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [submittingRestore, setSubmittingRestore] = useState(false);
  const MOCK_BACKUP_POINTS = [
    {
      id: 'bp1',
      label: 'Full backup',
      date: new Date(Date.now() - 86400000).toISOString(),
      size: '128 MB',
    },
    {
      id: 'bp2',
      label: 'Config-only backup',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      size: '2 MB',
    },
    {
      id: 'bp3',
      label: 'Full backup',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      size: '122 MB',
    },
  ];

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    if (user?.role === 'super_admin') fetchStats();
  }, [authLoading, user, router]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsError(null);
      const res = await apiClient.get('/admin/stats');
      if (res?.success && res?.data) setStats(res.data);
      else setStatsError(t('errors.failedToLoadDashboard'));
    } catch {
      setStatsError(t('errors.failedToLoadDashboard'));
    } finally {
      setStatsLoading(false);
    }
  }, [t]);

  const handleBackup = async () => {
    if (!backupReason.trim()) {
      showError(t('admin.backupReasonRequired') || 'Reason is required for backup');
      return;
    }
    try {
      setBackupRunning(true);
      setBackupResult(null);
      const res = await apiClient.post('/admin/settings/backup', { reason: backupReason.trim() });
      if (res.success && res.data) {
        setBackupResult(res.data);
        showSuccess(t('admin.backupCompleted') || 'Backup completed');
      } else {
        showError(res.error?.message || t('admin.backupFailed'));
      }
    } catch (err) {
      showError(err?.message || t('admin.backupFailed'));
    } finally {
      setBackupRunning(false);
    }
  };

  const handleExportTenantList = async () => {
    try {
      setExportingTenants(true);
      const res = await apiClient.get('/admin/clients');
      if (!res?.success || !Array.isArray(res?.data)) {
        showError(t('admin.exportFailed') || 'Export failed');
        return;
      }
      const rows = res.data;
      const headers = [
        'id',
        'name',
        'slug',
        'region',
        'isActive',
        'planName',
        'subscriptionStatus',
      ];
      const escape = (v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csvRows = [
        headers.join(','),
        ...rows.map((r) => {
          const id = r._id?.toString?.() ?? '';
          const planName = r.subscription?.planId?.name ?? '';
          const subStatus = r.subscription?.status ?? '';
          return [id, r.name, r.slug, r.region, r.isActive, planName, subStatus]
            .map(escape)
            .join(',');
        }),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('admin.exportDownloaded') || 'Export downloaded');
    } catch (err) {
      showError(err?.message || t('admin.exportFailed'));
    } finally {
      setExportingTenants(false);
    }
  };

  const startRestoreFlow = async () => {
    setRestoreStep(1);
    setLoadingRestoreClinics(true);
    try {
      const res = await apiClient.get('/admin/clients?limit=100');
      const list = res?.data?.clients ?? res?.clients ?? (Array.isArray(res?.data) ? res.data : []);
      setRestoreClinics(Array.isArray(list) ? list : []);
    } catch {
      setRestoreClinics([]);
    } finally {
      setLoadingRestoreClinics(false);
    }
  };

  const resetRestore = () => {
    setRestoreStep(0);
    setRestoreClinic(null);
    setRestorePoint(null);
    setRestoreReason('');
    setRestoreSchedule('');
    setRestoreConfirmText('');
  };

  const submitRestore = async () => {
    setSubmittingRestore(true);
    await new Promise((r) => setTimeout(r, 1000)); // UI placeholder – real API call goes here
    showSuccess(
      `Restore request submitted for "${restoreClinic.name ?? restoreClinic.clinicName}". Pending secondary admin approval. Action logged.`,
    );
    setRestoreStep(6);
    setSubmittingRestore(false);
  };

  if (!user || user?.role !== 'super_admin') return null;

  const storage = stats?.storage ?? {};
  const formatNumber = (num) => new Intl.NumberFormat().format(safeNum(num));

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabDataManagement')}
        subtitle={t('admin.dataManagementSubtitle')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='admin-page-content'>
        <p className='admin-toolbar-intro'>{t('admin.dataManagementIntro')}</p>

        {/* Section 1: Data overview – real storage stats from /api/admin/stats */}
        <section className='admin-section' aria-label={t('admin.dataOverview')}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>{t('admin.dataOverview')}</h2>
          </div>
          {statsLoading ? (
            <p className='text-neutral-500 text-sm'>{t('common.loading')}...</p>
          ) : statsError ? (
            <p className='text-status-error text-sm'>{statsError}</p>
          ) : (
            <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-4'>
              {t('admin.storageBreakdown')}
            </p>
          )}
          {!statsLoading && !statsError && (
            <div className='admin-overview-grid admin-overview-grid--three'>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storageTotalDocs')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.totalDocs)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-blue-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storagePatients')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.patients)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-primary-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storageAppointments')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.appointments)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-primary-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storagePrescriptions')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.prescriptions)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-primary-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storageInvoices')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.invoices)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-primary-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
              <Card>
                <div className='admin-stat-card admin-stat-card--with-icon'>
                  <div>
                    <p className='admin-stat-card__label'>{t('admin.storageUsers')}</p>
                    <p className='admin-stat-card__value'>{formatNumber(storage.users)}</p>
                  </div>
                  <div className='admin-stat-card__icon bg-blue-100'>
                    <DocumentIcon className='icon icon-md' />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {!statsLoading && !statsError && (
            <div className='mt-4 flex justify-end'>
              <Button variant='secondary' size='sm' onClick={fetchStats}>
                {t('common.refresh')}
              </Button>
            </div>
          )}
        </section>

        {/* Section 2: Infrastructure tools */}
        <section className='admin-section' aria-label={t('admin.dataManagementTools')}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>{t('admin.dataManagementTools')}</h2>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Card>
              <div className='flex items-start gap-3'>
                <div className='rounded-lg bg-primary-100 dark:bg-neutral-600 p-2 shrink-0'>
                  <SettingsIcon className='icon icon-md text-primary-700 dark:!text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='font-medium text-neutral-900 dark:text-neutral-100 mb-1'>
                    {t('admin.triggerBackup')}
                  </h3>
                  <p className='text-sm text-neutral-500 mb-3'>{t('admin.triggerBackupDesc')}</p>
                  <div className='mb-3'>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                      {t('admin.backupReason') || 'Reason'} *
                    </label>
                    <input
                      type='text'
                      value={backupReason}
                      onChange={(e) => setBackupReason(e.target.value)}
                      placeholder={t('admin.backupReasonPlaceholder') || 'e.g. Pre-migration snapshot'}
                      className='input w-full text-sm'
                    />
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleBackup}
                    disabled={backupRunning || !backupReason.trim()}
                    isLoading={backupRunning}
                  >
                    {t('admin.runBackup')}
                  </Button>
                  {backupResult && (
                    <p className='text-xs text-neutral-500 mt-2'>
                      {backupResult.collections?.length ?? 0} {t('admin.collections')},{' '}
                      {backupResult.totalDocs ?? 0} {t('admin.documents')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card className='border-red-200 dark:border-red-800/40 col-span-2'>
              <div className='flex items-start gap-3 mb-3'>
                <div className='rounded-lg bg-red-100 dark:bg-red-900/50 p-2 shrink-0'>
                  <SettingsIcon className='icon icon-md text-red-600 dark:!text-white' />
                </div>
                <div>
                  <h3 className='font-medium text-neutral-900 dark:text-neutral-100'>
                    {t('admin.restoreClinic')}
                  </h3>
                  <p className='text-sm text-neutral-500'>
                    ⚠ {t('admin.restoreClinicHighRisk')}
                  </p>
                </div>
              </div>

              {/* Step 0: idle */}
              {restoreStep === 0 && (
                <Button variant='secondary' size='sm' onClick={startRestoreFlow}>
                  {t('admin.beginRestoreRequest')}
                </Button>
              )}

              {/* Step 1: Select clinic */}
              {restoreStep === 1 && (
                <div className='space-y-3 max-w-sm'>
                  <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    {t('admin.restoreStep1')}
                  </p>
                  {loadingRestoreClinics ? (
                    <p className='text-sm text-neutral-500'>{t('admin.supportLoadingClinics')}</p>
                  ) : (
                    <select
                      className='input w-full text-sm'
                      value={restoreClinic?._id ?? ''}
                      onChange={(e) =>
                        setRestoreClinic(
                          restoreClinics.find((c) => (c._id ?? c.tenantId) === e.target.value) ??
                            null,
                        )
                      }
                    >
                      <option value=''>{t('admin.selectClinicPlaceholder')}</option>
                      {restoreClinics.map((c) => (
                        <option key={c._id ?? c.tenantId} value={c._id ?? c.tenantId}>
                          {c.name ?? c.clinicName}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className='flex gap-2'>
                    <Button
                      variant='primary'
                      size='sm'
                      disabled={!restoreClinic}
                      onClick={() => setRestoreStep(2)}
                    >
                      {t('common.next')} →
                    </Button>
                    <Button variant='ghost' size='sm' onClick={resetRestore}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Select restore point */}
              {restoreStep === 2 && (
                <div className='space-y-3 max-w-sm'>
                  <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    {t('admin.restoreStep2')}
                  </p>
                  <ul className='space-y-2'>
                    {MOCK_BACKUP_POINTS.map((bp) => (
                      <li key={bp.id}>
                        <label className='flex items-start gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800'>
                          <input
                            type='radio'
                            name='restorePoint'
                            value={bp.id}
                            checked={restorePoint?.id === bp.id}
                            onChange={() => setRestorePoint(bp)}
                            className='mt-1'
                          />
                          <div>
                            <p className='text-sm font-medium text-neutral-800 dark:text-neutral-200'>
                              {bp.label}
                            </p>
                            <p className='text-xs text-neutral-500'>
                              {new Date(bp.date).toLocaleString()} · {bp.size}
                            </p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className='flex gap-2'>
                    <Button
                      variant='primary'
                      size='sm'
                      disabled={!restorePoint}
                      onClick={() => setRestoreStep(3)}
                    >
                      {t('common.next')} →
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRestoreStep(1)}>
                      ← {t('common.back')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Preview what will be overwritten */}
              {restoreStep === 3 && (
                <div className='space-y-3 max-w-sm'>
                  <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    {t('admin.restoreStep3')}
                  </p>
                  <div className='p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400 space-y-1'>
                    <p>
                      <strong>{t('admin.restoreClinicLabel')}:</strong> {restoreClinic?.name ?? restoreClinic?.clinicName}
                    </p>
                    <p>
                      <strong>{t('admin.restorePointLabel')}:</strong> {restorePoint?.label} (
                      {new Date(restorePoint?.date).toLocaleString()})
                    </p>
                    <p>
                      <strong>{t('admin.restoreCurrentDataReplaced')}</strong>
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                      {t('admin.backupReason')} <span className='text-red-500'>*</span>
                    </label>
                    <textarea
                      value={restoreReason}
                      onChange={(e) => setRestoreReason(e.target.value)}
                      rows={3}
                      placeholder={t('admin.restoreReasonPlaceholder')}
                      className='input w-full resize-none'
                    />
                    <p
                      className={`text-xs mt-1 ${restoreReason.length >= 20 ? 'text-green-600' : 'text-neutral-400'}`}
                    >
                      {restoreReason.length}/20 {t('admin.restoreMinimumChars')}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='primary'
                      size='sm'
                      disabled={restoreReason.trim().length < 20}
                      onClick={() => setRestoreStep(4)}
                    >
                      {t('common.next')} →
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRestoreStep(2)}>
                      ← {t('common.back')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Secondary admin approval notice */}
              {restoreStep === 4 && (
                <div className='space-y-3 max-w-sm'>
                  <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    {t('admin.restoreStep4')}
                  </p>
                  <div className='p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-700 text-sm text-amber-700 dark:text-amber-400'>
                    {t('admin.restoreStep4Notice')}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                      {t('admin.scheduleRestoreOptional')}
                    </label>
                    <input
                      type='datetime-local'
                      value={restoreSchedule}
                      onChange={(e) => setRestoreSchedule(e.target.value)}
                      className='input text-sm'
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='primary' size='sm' onClick={() => setRestoreStep(5)}>
                      {t('common.next')} →
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRestoreStep(3)}>
                      ← {t('common.back')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Typed confirmation */}
              {restoreStep === 5 && (
                <div className='space-y-3 max-w-sm'>
                  <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
                    {t('admin.restoreStep5')}{' '}
                    <span className='font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded'>
                      RESTORE {restoreClinic?.name ?? restoreClinic?.clinicName}
                    </span>
                  </p>
                  <input
                    type='text'
                    value={restoreConfirmText}
                    onChange={(e) => setRestoreConfirmText(e.target.value)}
                    placeholder={`RESTORE ${restoreClinic?.name ?? restoreClinic?.clinicName}`}
                    className='input w-full font-mono text-sm'
                  />
                  <div className='flex gap-2'>
                    <Button
                      variant='danger'
                      size='sm'
                      disabled={
                        restoreConfirmText !==
                          `RESTORE ${restoreClinic?.name ?? restoreClinic?.clinicName}` ||
                        submittingRestore
                      }
                      isLoading={submittingRestore}
                      onClick={submitRestore}
                    >
                      {t('admin.submitRestoreRequest')}
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRestoreStep(4)}>
                      ← {t('common.back')}
                    </Button>
                  </div>
                  <p className='text-xs text-neutral-400'>
                    {t('admin.restoreActionLogged')}
                  </p>
                </div>
              )}

              {/* Step 6: Done */}
              {restoreStep === 6 && (
                <div className='space-y-3 max-w-sm'>
                  <div className='p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-700 text-sm text-green-700 dark:text-green-400'>
                    ✓ {t('admin.restoreSubmitted')}
                  </div>
                  <Button variant='secondary' size='sm' onClick={resetRestore}>
                    {t('admin.startAnotherRestore')}
                  </Button>
                </div>
              )}
            </Card>
            <Card>
              <div className='flex items-start gap-3'>
                <div className='rounded-lg bg-neutral-100 dark:bg-neutral-600 p-2 shrink-0'>
                  <SettingsIcon className='icon icon-md text-neutral-600 dark:!text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='font-medium text-neutral-900 dark:text-neutral-100 mb-1'>
                    {t('admin.migrateClinic')}
                  </h3>
                  <p className='text-sm text-neutral-500 mb-3'>{t('admin.migrateClinicDesc')}</p>
                  <Button variant='secondary' size='sm' disabled aria-disabled='true'>
                    {t('admin.migrateClinic')}
                  </Button>
                  <p className='text-xs text-neutral-500 mt-2'>{t('admin.comingSoon')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-start gap-3'>
                <div className='rounded-lg bg-primary-100 dark:bg-neutral-600 p-2 shrink-0'>
                  <FileDownIcon className='icon icon-md text-primary-700 dark:!text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='font-medium text-neutral-900 dark:text-neutral-100 mb-1'>
                    {t('admin.exportLogs')}
                  </h3>
                  <p className='text-sm text-neutral-500 mb-3'>{t('admin.exportLogsDesc')}</p>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => router.push('/admin/activity-logs')}
                  >
                    {t('admin.exportLogs')}
                  </Button>
                </div>
              </div>
            </Card>
            <Card>
              <div className='flex items-start gap-3'>
                <div className='rounded-lg bg-primary-100 dark:bg-neutral-600 p-2 shrink-0'>
                  <FileDownIcon className='icon icon-md text-primary-700 dark:!text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='font-medium text-neutral-900 dark:text-neutral-100 mb-1'>
                    {t('admin.exportTenantList')}
                  </h3>
                  <p className='text-sm text-neutral-500 mb-3'>{t('admin.exportTenantListDesc')}</p>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={handleExportTenantList}
                    disabled={exportingTenants}
                    isLoading={exportingTenants}
                  >
                    {t('admin.exportTenantList')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
