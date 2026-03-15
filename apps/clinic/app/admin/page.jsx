'use client';

/**
 * Super Admin Overview – SaaS Platform Governance Panel.
 * Layout: Section 1 System Overview (8 cards), Section 2 Platform Alerts, Section 3 Risk Monitoring.
 * Per Super_Admin.md: tenant-level only; no marketplace concepts (no doctor verifications, reviews, complaints, content).
 */

import { AdminSkeleton } from '@/app/admin/components/AdminSkeleton';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function safeNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { currency, locale } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const DISMISSED_ALERTS_KEY = 'admin_dismissed_alerts';
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = sessionStorage.getItem(DISMISSED_ALERTS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });
  const dismissAlert = (tenantId, alertType) => {
    const key = `${tenantId}:${alertType}`;
    setDismissedAlerts((prev) => {
      const next = new Set(prev);
      next.add(key);
      try {
        sessionStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...next]));
      } catch (_) {}
      return next;
    });
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    }
  }, [authLoading, user, router]);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await apiClient.get('/admin/stats');
      if (res?.success && res?.data) {
        setStats(res.data);
      } else {
        setError(t('errors.failedToLoadDashboard'));
      }
    } catch (err) {
      logger.error('Failed to fetch admin stats', err);
      setError(t('errors.failedToLoadDashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (amount) => formatCurrencyUtil(safeNum(amount), currency, locale);
  const formatNumber = (num) => new Intl.NumberFormat(locale || 'en-US').format(safeNum(num));

  /** Super_Admin.md: Total Storage Usage formatted as GB/TB. Estimate from doc count when bytes not available. */
  const formatStorageGB = (totalDocs) => {
    const n = safeNum(totalDocs);
    const estimatedMB = n * 0.01; // rough 10KB per doc
    if (estimatedMB >= 1024) return `${(estimatedMB / 1024).toFixed(1)} TB`;
    if (estimatedMB >= 1) return `${estimatedMB.toFixed(1)} GB`;
    return `${(estimatedMB * 1024).toFixed(0)} MB`;
  };

  /** Super_Admin.md: System Health badge HEALTHY / DEGRADED / CRITICAL */
  const systemHealthBadge = (systemHealthObj) => {
    const status = (systemHealthObj?.status || 'operational').toLowerCase();
    if (status === 'healthy' || status === 'operational') return { label: 'HEALTHY', variant: 'success' };
    if (status === 'degraded') return { label: 'DEGRADED', variant: 'warning' };
    if (status === 'critical') return { label: 'CRITICAL', variant: 'danger' };
    return { label: 'HEALTHY', variant: 'success' };
  };

  if (!user) return null;
  if (user?.role !== 'super_admin') return null;

  if (loading) {
    return (
      <Layout
        title={t('admin.superAdminDashboard')}
        subtitle={t('admin.description')}
        loading
        loadingText={t('common.loading')}
        skeleton={
          <div className='admin-page-content'>
            <AdminSkeleton />
          </div>
        }
      />
    );
  }

  if (error && !stats) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-status-error mb-2'>
              {t('admin.errorLoadingDashboard')}
            </h2>
            <p className='text-neutral-500 mb-4'>{error}</p>
            <Button onClick={handleRefresh}>{t('admin.retry')}</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tenants = stats?.tenants ?? {};
  const subscriptions = stats?.subscriptions ?? {};
  const users = stats?.users ?? {};
  const storage = stats?.storage ?? {};
  const revenue = stats?.revenue ?? {};
  const systemHealth = stats?.systemHealth ?? {};
  const platformAlerts = stats?.platformAlerts ?? {};
  const riskMonitoring = stats?.riskMonitoring ?? {};

  const clinicProfileLink = (tenantId) =>
    tenantId ? `/admin/clients/${encodeURIComponent(tenantId)}` : '/admin/clients';

  return (
    <Layout>
      <PageHeader
        title={t('admin.superAdminDashboard')}
        subtitle={t('admin.description')}
        notifications={[]}
        unreadCount={0}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <div className='admin-page-content'>
        {/* Section 1: System Overview – 8 cards (Super_Admin.md) */}
        <section className='admin-section' aria-label={t('admin.systemOverview')}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>{t('admin.systemOverview')}</h2>
          </div>
          <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-4'>
            {t('admin.overviewPurpose')}
          </p>
          <div className='admin-overview-grid'>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.activeClinics')}</p>
                  <p className='admin-stat-card__value'>{formatNumber(tenants.active)}</p>
                </div>
                <div className='admin-stat-card__icon bg-primary-100'>
                  <BuildingIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.clinicsInTrial')}</p>
                  <p className='admin-stat-card__value'>{formatNumber(subscriptions.inTrial)}</p>
                </div>
                <div className='admin-stat-card__icon bg-amber-100'>
                  <ClockIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.expiredClinics')}</p>
                  <p className='admin-stat-card__value'>{formatNumber(subscriptions.expired)}</p>
                </div>
                <div className='admin-stat-card__icon bg-red-100'>
                  <ClockIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.activeSubscriptions')}</p>
                  <p className='admin-stat-card__value'>{formatNumber(subscriptions.active)}</p>
                </div>
                <div className='admin-stat-card__icon bg-primary-100'>
                  <CardIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.totalUsersAcrossClinics')}</p>
                  <p className='admin-stat-card__value'>{formatNumber(users.total)}</p>
                </div>
                <div className='admin-stat-card__icon bg-blue-100'>
                  <UsersIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.storageUsage')}</p>
                  <p className='admin-stat-card__value'>{formatStorageGB(storage.totalDocs)}</p>
                </div>
                <div className='admin-stat-card__icon bg-blue-100'>
                  <StorageIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.mrr')}</p>
                  <p className='admin-stat-card__value'>
                    {formatCurrency(revenue.mrr ?? subscriptions.mrr)}
                  </p>
                </div>
                <div className='admin-stat-card__icon bg-green-100'>
                  <CurrencyIcon />
                </div>
              </div>
            </Card>
            <Card>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>{t('admin.systemHealth')}</p>
                  <p className='admin-stat-card__value'>
                    <span
                      className={
                        systemHealthBadge(systemHealth).variant === 'success'
                          ? 'text-green-700 dark:text-green-400'
                          : systemHealthBadge(systemHealth).variant === 'warning'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                      }
                    >
                      {systemHealthBadge(systemHealth).label}
                    </span>
                  </p>
                </div>
                <div className='admin-stat-card__icon bg-green-100'>
                  <CheckIcon />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 2: Platform Alerts (each links to clinic) – same design as pending strip */}
        <section className='admin-section' aria-label={t('admin.platformAlerts')}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>{t('admin.platformAlerts')}</h2>
            <Link
              href='/admin/clients'
              className='ml-auto text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-white dark:hover:text-neutral-200'
            >
              {t('admin.viewAll')}
            </Link>
          </div>
          <div className='admin-pending'>
            <div className='admin-pending-grid'>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item'
                onClick={() => router.push('/admin/subscriptions')}
              >
                <span className='admin-pending-item__label'>{t('admin.alertTrialEndingSoon')}</span>
                <p className='admin-pending-item__value'>
                  {formatNumber(platformAlerts.trialEndingSoon?.count ?? 0)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item'
                onClick={() => router.push('/admin/subscriptions')}
              >
                <span className='admin-pending-item__label'>{t('admin.alertPaymentFailures')}</span>
                <p className='admin-pending-item__value'>
                  {formatNumber(platformAlerts.paymentFailures?.count ?? 0)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item'
                onClick={() => router.push('/admin/clients')}
              >
                <span className='admin-pending-item__label'>
                  {t('admin.alertStorageNearingLimit')}
                </span>
                <p className='admin-pending-item__value'>
                  {formatNumber(platformAlerts.storageNearingLimit?.count ?? 0)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item'
                onClick={() => router.push('/admin/clients?status=inactive')}
              >
                <span className='admin-pending-item__label'>
                  {t('admin.alertInactiveClinics30d')}
                </span>
                <p className='admin-pending-item__value'>
                  {formatNumber(platformAlerts.inactiveClinics30d?.count ?? 0)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item'
                onClick={() => router.push('/admin/clients')}
              >
                <span className='admin-pending-item__label'>
                  {t('admin.alertSuspendedClinics')}
                </span>
                <p className='admin-pending-item__value'>
                  {formatNumber(platformAlerts.suspendedClinics?.count ?? 0)}
                </p>
              </Button>
            </div>
          </div>
          {/* List of clinics per alert type (each links to clinic) – Card + design system classes */}
          {[
            { key: 'trialEndingSoon', labelKey: 'admin.alertTrialEndingSoon' },
            { key: 'paymentFailures', labelKey: 'admin.alertPaymentFailures' },
            { key: 'storageNearingLimit', labelKey: 'admin.alertStorageNearingLimit' },
            { key: 'inactiveClinics30d', labelKey: 'admin.alertInactiveClinics30d' },
            { key: 'suspendedClinics', labelKey: 'admin.alertSuspendedClinics' },
          ].map(({ key, labelKey }) => {
            const data = platformAlerts[key];
            const items = (data?.items ?? []).filter(
              (item) => !dismissedAlerts.has(`${item.tenantId}:${key}`),
            );
            if (items.length === 0) return null;
            return (
              <Card key={key} className='admin-alert-list mt-4'>
                <p className='admin-stat-card__label'>
                  {t(labelKey)} ({items.length})
                </p>
                <ul className='admin-alert-list__items'>
                  {items.map((item) => (
                    <li key={item.tenantId} className='flex items-center justify-between gap-2'>
                      <Link href={clinicProfileLink(item.tenantId)} className='admin-alert-list__link flex-1'>
                        {item.name || item.tenantId}
                      </Link>
                      <button
                        type='button'
                        onClick={() => dismissAlert(item.tenantId, key)}
                        className='text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-sm shrink-0'
                        aria-label={t('admin.dismissAlert') || 'Dismiss'}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </section>

        {/* Section 3: Risk Monitoring */}
        <section className='admin-section' aria-label={t('admin.riskMonitoring')}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>{t('admin.riskMonitoring')}</h2>
            <Link
              href='/admin/clients'
              className='ml-auto text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-white dark:hover:text-neutral-200'
            >
              {t('admin.viewAll')}
            </Link>
          </div>
          <div className='admin-pending'>
            <div className='admin-pending-grid'>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item admin-pending-item--warning'
                onClick={() => router.push('/admin/subscriptions')}
              >
                <span className='admin-pending-item__label'>
                  {t('admin.riskExpiringSubscriptions')}
                </span>
                <p className='admin-pending-item__value'>
                  {formatNumber(riskMonitoring.expiringSubscriptions)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item admin-pending-item--warning'
                onClick={() => router.push('/admin/settings/security')}
              >
                <span className='admin-pending-item__label'>{t('admin.riskSecurityAlerts')}</span>
                <p className='admin-pending-item__value'>
                  {formatNumber(riskMonitoring.securityAlerts)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item admin-pending-item--warning'
                onClick={() => router.push('/admin/clients')}
              >
                <span className='admin-pending-item__label'>{t('admin.riskSuspendedClinics')}</span>
                <p className='admin-pending-item__value'>
                  {formatNumber(riskMonitoring.suspendedClinics)}
                </p>
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='admin-pending-item admin-pending-item--warning'
                onClick={() => router.push('/admin/activity-logs')}
              >
                <span className='admin-pending-item__label'>{t('admin.riskAuditAnomalies')}</span>
                <p className='admin-pending-item__value'>
                  {formatNumber(riskMonitoring.auditAnomalies)}
                </p>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function BuildingIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
      />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
      />
    </svg>
  );
}
function StorageIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
      />
    </svg>
  );
}
function CurrencyIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg
      className='icon icon-md text-neutral-900 dark:text-white'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
}
