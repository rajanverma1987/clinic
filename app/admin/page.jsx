'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency, locale } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchStats();
    }
  }, [authLoading, user]);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/admin/stats');

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat(locale || 'en-US').format(num || 0);
  };

  // Redirect handled in useEffect above
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  if (error && !stats) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-status-error mb-2'>Error Loading Dashboard</h2>
            <p className='text-neutral-500 mb-4'>{error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        {/* Header */}
        <PageHeader
          title='Super Admin Dashboard'
          description='Complete system overview and management'
          actionButton={
            <Button variant='secondary' onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          }
        />

        {/* System Overview Stats */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>System Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Tenants</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.tenants?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.tenants?.active || 0)} active, {formatNumber(stats?.tenants?.inactive || 0)} inactive
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Users</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.users?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.users?.active || 0)} active, {formatNumber(stats?.users?.superAdmins || 0)} super admins
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Patients</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.patients?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.patients?.thisMonth || 0)} added this month
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Appointments</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.appointments?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.appointments?.today || 0)} today, {formatNumber(stats?.appointments?.thisMonth || 0)} this month
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Financial Overview */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Financial Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Revenue</p>
                    <p className='text-2xl font-bold text-neutral-900 mt-2'>
                      {formatCurrency(stats?.revenue?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatCurrency(stats?.revenue?.thisMonth || 0)} this month
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Monthly Recurring Revenue</p>
                    <p className='text-2xl font-bold text-neutral-900 mt-2'>
                      {formatCurrency(stats?.revenue?.mrr || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                  </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  From {formatNumber(stats?.subscriptions?.active || 0)} active subscriptions
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Invoices</p>
                    <p className='text-2xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.invoices?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.invoices?.pending || 0)} pending, {formatNumber(stats?.invoices?.paid || 0)} paid
                </p>
            </div>
          </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Total Payments</p>
                    <p className='text-2xl font-bold text-neutral-900 mt-2'>
                      {formatCurrency(stats?.payments?.totalAmount || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.payments?.total || 0)} transactions
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Subscriptions & Plans */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Subscriptions & Plans</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-neutral-600'>Active Subscriptions</p>
                  <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.subscriptions?.active || 0)}
                  </p>
                </div>
                <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.subscriptions?.total || 0)} total, {formatNumber(stats?.subscriptions?.cancelled || 0)} cancelled
              </p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                    <p className='text-sm font-medium text-neutral-600'>Subscription Plans</p>
                  <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.plans?.total || 0)}
                  </p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.plans?.active || 0)} active plans
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Expired Subscriptions</p>
                    <p className='text-3xl font-bold text-status-error mt-2'>
                      {formatNumber(stats?.subscriptions?.expired || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  Requires attention
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Clinical Data */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Clinical Data</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Prescriptions</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.prescriptions?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                  </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.prescriptions?.active || 0)} active, {formatNumber(stats?.prescriptions?.pending || 0)} pending
                </p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-neutral-600'>Inventory Items</p>
                    <p className='text-3xl font-bold text-neutral-900 mt-2'>
                      {formatNumber(stats?.inventory?.total || 0)}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                    </svg>
                  </div>
                </div>
                <p className='text-sm text-neutral-500 mt-2'>
                  {formatNumber(stats?.inventory?.active || 0)} active, {formatNumber(stats?.inventory?.lowStock || 0)} low stock
                </p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-neutral-600'>System Health</p>
                  <p className='text-3xl font-bold text-secondary-600 mt-2'>100%</p>
                </div>
                <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                    <svg width='24px' height='24px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>All systems operational</p>
            </div>
          </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Quick Actions & Management</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-neutral-900'>Clients</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                </svg>
              </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  Manage all clinic tenants and their settings
                </p>
                <Button variant='primary' onClick={() => router.push('/admin/clients')} className='w-full' size='sm'>
                Manage Clients
              </Button>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-neutral-900'>Subscription Plans</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  Create and manage subscription plans and pricing
                </p>
                <Button variant='primary' onClick={() => router.push('/admin/subscriptions')} className='w-full' size='sm'>
                Manage Plans
              </Button>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>All Subscriptions</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  View and manage all tenant subscriptions
                </p>
                <Button variant='secondary' onClick={() => router.push('/admin/subscriptions')} className='w-full' size='sm'>
                  View Subscriptions
                </Button>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>All Users</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  View and manage all users across all tenants
                </p>
                <Button variant='primary' onClick={() => router.push('/admin/users')} className='w-full' size='sm'>
                  Manage Users
                </Button>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>Create Admin</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
                </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  Create new super admin or clinic admin accounts
                </p>
                <Button variant='primary' onClick={() => router.push('/admin/create-admin')} className='w-full' size='sm'>
                  Create Admin
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Management Options */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>System Management</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>System Settings</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  Configure system-wide settings and preferences
                </p>
                <Button variant='secondary' onClick={() => router.push('/settings')} className='w-full' size='sm'>
                System Settings
              </Button>
            </div>
          </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>Reports & Analytics</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  View comprehensive reports and analytics
                </p>
                <Button variant='secondary' onClick={() => router.push('/reports')} className='w-full' size='sm'>
                  View Reports
                </Button>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>Database Tools</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  Database management and maintenance tools
                </p>
                <Button variant='secondary' onClick={() => alert('Database tools coming soon')} className='w-full' size='sm'>
                  Database Tools
                </Button>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-neutral-900'>Audit Logs</h3>
                  <svg width='32px' height='32px' className='text-neutral-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <p className='text-neutral-600 mb-4 text-sm'>
                  View system audit logs and activity history
                </p>
                <Button variant='secondary' onClick={() => alert('Audit logs coming soon')} className='w-full' size='sm'>
                  View Logs
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Recent Activity (Last 7 Days)</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <div className='p-6'>
                <p className='text-sm font-medium text-neutral-600'>New Tenants</p>
                <p className='text-2xl font-bold text-neutral-900 mt-2'>
                  {formatNumber(stats?.tenants?.recent || 0)}
                </p>
                <p className='text-sm text-neutral-500 mt-2'>Created in last 7 days</p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <p className='text-sm font-medium text-neutral-600'>New Users</p>
                <p className='text-2xl font-bold text-neutral-900 mt-2'>
                  {formatNumber(stats?.users?.recent || 0)}
                </p>
                <p className='text-sm text-neutral-500 mt-2'>Registered in last 7 days</p>
              </div>
            </Card>

            <Card>
              <div className='p-6'>
                <p className='text-sm font-medium text-neutral-600'>New Patients</p>
                <p className='text-2xl font-bold text-neutral-900 mt-2'>
                  {formatNumber(stats?.patients?.recent || 0)}
                </p>
                <p className='text-sm text-neutral-500 mt-2'>Added in last 7 days</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Breakdown Tables */}
        {stats?.tenants?.byRegion && stats.tenants.byRegion.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Tenants by Region</h2>
            <Card>
              <div className='p-6'>
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4'>
                  {stats.tenants.byRegion.map((region) => (
                    <div key={region._id} className='text-center p-4 bg-neutral-50 rounded-lg'>
                      <p className='text-sm font-medium text-neutral-600'>{region._id || 'Unknown'}</p>
                      <p className='text-2xl font-bold text-neutral-900 mt-2'>{formatNumber(region.count)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {stats?.users?.byRole && stats.users.byRole.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-semibold text-neutral-900 mb-4'>Users by Role</h2>
            <Card>
              <div className='p-6'>
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4'>
                  {stats.users.byRole.map((role) => (
                    <div key={role._id} className='text-center p-4 bg-neutral-50 rounded-lg'>
                      <p className='text-sm font-medium text-neutral-600 capitalize'>{role._id?.replace('_', ' ') || 'Unknown'}</p>
                      <p className='text-2xl font-bold text-neutral-900 mt-2'>{formatNumber(role.count)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
