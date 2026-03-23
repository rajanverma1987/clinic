'use client';

/**
 * Super_Admin.md: Clinic Profile page at /admin/clients/[id].
 * Tabs: Overview, Users, Storage, Activity, Subscription.
 */

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const TAB_OVERVIEW = 'overview';
const TAB_USERS = 'users';
const TAB_STORAGE = 'storage';
const TAB_ACTIVITY = 'activity';
const TAB_SUBSCRIPTION = 'subscription';

const TABS = [
  { id: TAB_OVERVIEW, labelKey: 'admin.profileTabOverview' },
  { id: TAB_USERS, labelKey: 'admin.profileTabUsers' },
  { id: TAB_STORAGE, labelKey: 'admin.profileTabStorage' },
  { id: TAB_ACTIVITY, labelKey: 'admin.profileTabActivity' },
  { id: TAB_SUBSCRIPTION, labelKey: 'admin.profileTabSubscription' },
];

export default function AdminClientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState(null);
  const [usage, setUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await apiClient.get(`/admin/clients/${id}`);
      if (res?.success && res?.data) {
        setClient(res.data);
      } else {
        setError(res?.error?.message || t('errors.notFound'));
      }
    } catch (err) {
      setError(err?.message || t('errors.failedToLoadDashboard'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const fetchUsage = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiClient.get(`/admin/clients/${id}/usage`);
      if (res?.success && res?.data) setUsage(res.data);
    } catch (_) {
      setUsage(null);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    if (!id) return;
    setLoadingUsers(true);
    try {
      const res = await apiClient.get(`/admin/users?tenantId=${id}&limit=100`);
      if (res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setUsers(list);
      } else {
        setUsers([]);
      }
    } catch (_) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [id]);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    setLoadingActivity(true);
    try {
      const res = await apiClient.get(
        `/admin/activity-logs?resourceId=${id}&resource=tenant&limit=50`,
      );
      if (res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setActivityLogs(Array.isArray(list) ? list : []);
      } else {
        setActivityLogs([]);
      }
    } catch (_) {
      setActivityLogs([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') {
      router.push('/unauthorized');
      return;
    }
    if (user?.role === 'super_admin' && id) {
      fetchClient();
      fetchUsage();
    }
  }, [authLoading, user, router, id, fetchClient, fetchUsage]);

  useEffect(() => {
    if (activeTab === TAB_USERS && id) fetchUsers();
  }, [activeTab, id, fetchUsers]);

  useEffect(() => {
    if (activeTab === TAB_ACTIVITY && id) fetchActivity();
  }, [activeTab, id, fetchActivity]);

  if (!user || user?.role !== 'super_admin') return null;
  if (loading && !client) {
    return (
      <Layout title={t('admin.clinicDetails')}>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }
  if (error && !client) {
    return (
      <Layout>
        <div className='p-6'>
          <p className='text-status-error'>{error}</p>
          <Button variant='secondary' className='mt-4' onClick={() => router.push('/admin/clients')}>
            {t('admin.backToClients') || 'Back to clients'}
          </Button>
        </div>
      </Layout>
    );
  }
  if (!client) return null;

  const contactInfo = client.settings
    ? [client.settings.phone, client.settings.address?.city, client.settings.address?.country]
        .filter(Boolean)
        .join(' · ')
    : '—';

  return (
    <Layout>
      <PageHeader
        title={client.name || client.slug || id}
        subtitle={t('admin.clinicProfileSubtitle') || 'Clinic profile — overview, users, storage, activity, subscription'}
        breadcrumbs={[
          { label: t('admin.tabClinicManagement'), href: '/admin/clients' },
          { label: client.name || id, href: null },
        ]}
        notifications={[]}
        unreadCount={0}
      />
      <div className='admin-page-content'>
        {/* Tabs */}
        <div className='flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-700 mb-6'>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type='button'
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {t(tab.labelKey) || tab.id}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === TAB_OVERVIEW && (
          <section className='admin-section' aria-label={t('admin.profileTabOverview')}>
            <Card className='p-6'>
              <dl className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>{t('admin.clientName')}</dt>
                  <dd className='mt-1 font-medium'>{client.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>{t('admin.id') || 'ID'}</dt>
                  <dd className='mt-1 font-mono text-sm'>{client._id ?? id ?? '—'}</dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>{t('admin.created')}</dt>
                  <dd className='mt-1'>
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>{t('admin.subscriptionPlan')}</dt>
                  <dd className='mt-1'>
                    {client.subscription?.planId?.name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>{t('admin.status')}</dt>
                  <dd className='mt-1'>
                    {client.suspended ? (
                      <Tag variant='warning'>{t('admin.suspended')}</Tag>
                    ) : (
                      <Tag variant={client.isActive ? 'success' : 'danger'}>
                        {client.isActive ? t('admin.active') : t('admin.inactive')}
                      </Tag>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-neutral-500'>
                    {t('admin.contactInfo') || 'Contact info'}
                  </dt>
                  <dd className='mt-1 text-sm'>{contactInfo}</dd>
                </div>
              </dl>
            </Card>
          </section>
        )}

        {/* Tab: Users */}
        {activeTab === TAB_USERS && (
          <section className='admin-section' aria-label={t('admin.profileTabUsers')}>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500 mb-4'>
                {t('admin.profileUsersNote') ||
                  'Clinic users only. No clinical data.'}
              </p>
              {loadingUsers ? (
                <Loader />
              ) : users.length === 0 ? (
                <p className='text-neutral-500 py-4'>{t('admin.noUsersFound')}</p>
              ) : (
                <Table
                  columns={[
                    { key: 'name', label: t('admin.name') || 'Name' },
                    { key: 'email', label: t('admin.email') || 'Email' },
                    { key: 'role', label: t('admin.role') || 'Role' },
                    { key: 'lastLogin', label: t('admin.lastLogin') },
                    { key: 'status', label: t('admin.status') },
                  ]}
                  rows={users.map((u) => ({
                    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
                    email: u.email ?? '—',
                    role: u.role ?? '—',
                    lastLogin: u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—',
                    status: u.isActive ? (
                      <Tag variant='success'>{t('admin.active')}</Tag>
                    ) : (
                      <Tag variant='danger'>{t('admin.inactive')}</Tag>
                    ),
                  }))}
                />
              )}
              <div className='mt-4'>
                <Button
                  variant='secondary'
                  size='sm'
                  asChild
                >
                  <Link href={`/admin/users?tenantId=${id}`}>
                    {t('admin.viewAllUsers') || 'View all users'}
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Tab: Storage */}
        {activeTab === TAB_STORAGE && (
          <section className='admin-section' aria-label={t('admin.profileTabStorage')}>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500 mb-4'>
                {t('admin.profileStorageNote') || 'Used vs quota. File type breakdown when available.'}
              </p>
              {usage ? (
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('patients.patients')}</p>
                    <p className='text-xl font-semibold'>{Number(usage.patientsCount) ?? 0}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('admin.appointments')}</p>
                    <p className='text-xl font-semibold'>{Number(usage.appointmentsCount) ?? 0}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('admin.staff')}</p>
                    <p className='text-xl font-semibold'>{Number(usage.staffCount) ?? 0}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('admin.lastActivity')}</p>
                    <p className='text-sm'>
                      {usage.lastActivity
                        ? new Date(usage.lastActivity).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className='text-neutral-500 py-4'>{t('admin.noDataYet') || 'No data yet'}</p>
              )}
            </Card>
          </section>
        )}

        {/* Tab: Activity */}
        {activeTab === TAB_ACTIVITY && (
          <section className='admin-section' aria-label={t('admin.profileTabActivity')}>
            <Card className='p-6'>
              <p className='text-sm text-neutral-500 mb-4'>
                {t('admin.profileActivityNote') || 'Last 30 days login/activity timeline.'}
              </p>
              {loadingActivity ? (
                <Loader />
              ) : activityLogs.length === 0 ? (
                <p className='text-neutral-500 py-4'>{t('admin.noDataYet') || 'No activity yet'}</p>
              ) : (
                <ul className='space-y-2'>
                  {activityLogs.map((log) => (
                    <li
                      key={log._id ?? log.timestamp}
                      className='flex flex-wrap gap-2 text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2'
                    >
                      <span className='text-neutral-500'>
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </span>
                      <span>{log.action ?? log.resource ?? '—'}</span>
                      {log.userName && (
                        <span className='text-neutral-500'>{log.userName}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className='mt-4'>
                <Button variant='secondary' size='sm' asChild>
                  <Link href={`/admin/activity-logs?resourceId=${id}`}>
                    {t('admin.viewAllLogs') || 'View all logs'}
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        )}

        {/* Tab: Subscription */}
        {activeTab === TAB_SUBSCRIPTION && (
          <section className='admin-section' aria-label={t('admin.profileTabSubscription')}>
            <Card className='p-6'>
              {client.subscription ? (
                <dl className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <dt className='text-sm font-medium text-neutral-500'>
                      {t('admin.subscriptionPlan')}
                    </dt>
                    <dd className='mt-1 font-medium'>
                      {client.subscription.planId?.name ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-neutral-500'>
                      {t('admin.subscriptionStatus')}
                    </dt>
                    <dd className='mt-1'>
                      <Tag
                        variant={
                          {
                            ACTIVE: 'success',
                            CANCELLED: 'danger',
                            SUSPENDED: 'warning',
                            EXPIRED: 'danger',
                            PENDING: 'warning',
                          }[client.subscription.status] || 'default'
                        }
                      >
                        {client.subscription.status}
                      </Tag>
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-neutral-500'>
                      {t('admin.nextBilling')}
                    </dt>
                    <dd className='mt-1'>
                      {client.subscription.currentPeriodEnd
                        ? new Date(client.subscription.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm font-medium text-neutral-500'>
                      {t('admin.paymentStatus') || 'Payment status'}
                    </dt>
                    <dd className='mt-1'>{client.subscription.status ?? '—'}</dd>
                  </div>
                </dl>
              ) : (
                <p className='text-neutral-500 py-4'>{t('admin.noSubscription') || 'No subscription'}</p>
              )}
              <div className='mt-4'>
                <Button variant='secondary' size='sm' onClick={() => router.push('/admin/subscriptions')}>
                  {t('admin.manageSubscriptions') || 'Manage subscriptions'}
                </Button>
              </div>
            </Card>
          </section>
        )}

        <div className='mt-6'>
          <Button variant='secondary' onClick={() => router.push('/admin/clients')}>
            {t('admin.backToClients') || 'Back to clients'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
