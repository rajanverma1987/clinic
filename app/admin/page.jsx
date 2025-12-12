'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
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
      // Fetch clients
      const clientsResponse = await apiClient.get('/admin/clients');

      // Fetch subscriptions
      const subscriptionsResponse = await apiClient.get('/subscriptions');

      if (clientsResponse.success && subscriptionsResponse.success) {
        const clients = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        const subscriptions = Array.isArray(subscriptionsResponse.data)
          ? subscriptionsResponse.data
          : [];

        const activeClients = clients.filter((c) => c.isActive).length;
        const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE').length;

        // Calculate total revenue (sum of all subscription prices)
        const totalRevenue = subscriptions.reduce((sum, sub) => {
          if (sub.status === 'ACTIVE' && sub.planId?.price) {
            return sum + sub.planId.price;
          }
          return sum;
        }, 0);

        setStats({
          totalClients: clients.length,
          activeClients,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions,
          totalRevenue,
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
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

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-neutral-900'>Admin Dashboard</h1>
          <p className='text-neutral-600 mt-2'>
            Manage clients, subscriptions, and system settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-neutral-600'>Total Clients</p>
                  <p className='text-3xl font-bold text-neutral-900 mt-2'>
                    {stats?.totalClients || 0}
                  </p>
                </div>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-primary-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>{stats?.activeClients || 0} active</p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-neutral-600'>Active Subscriptions</p>
                  <p className='text-3xl font-bold text-neutral-900 mt-2'>
                    {stats?.activeSubscriptions || 0}
                  </p>
                </div>
                <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-secondary-600'
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
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>
                {stats?.totalSubscriptions || 0} total
              </p>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-neutral-600'>Monthly Revenue</p>
                  <p className='text-3xl font-bold text-neutral-900 mt-2'>
                    {stats
                      ? formatCurrency(stats.totalRevenue)
                      : formatCurrencyUtil(0, currency, locale)}
                  </p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-purple-600'
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
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>Recurring revenue</p>
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
                  <svg
                    className='w-6 h-6 text-secondary-600'
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
                </div>
              </div>
              <p className='text-sm text-neutral-500 mt-2'>All systems operational</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-neutral-900'>Clients</h3>
                <svg
                  className='w-8 h-8 text-primary-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <p className='text-neutral-600 mb-4'>
                View and manage all clinic clients, their subscriptions, and account status.
              </p>
              <Button
                variant='primary'
                onClick={() => router.push('/admin/clients')}
                className='w-full'
              >
                Manage Clients
              </Button>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-neutral-900'>Subscription Plans</h3>
                <svg
                  className='w-8 h-8 text-secondary-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <p className='text-neutral-600 mb-4'>
                Create and manage subscription plans, pricing, and features available to clients.
              </p>
              <Button
                variant='primary'
                onClick={() => router.push('/admin/subscriptions')}
                className='w-full'
              >
                Manage Plans
              </Button>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-neutral-900'>System Settings</h3>
                <svg
                  className='w-8 h-8 text-purple-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              </div>
              <p className='text-neutral-600 mb-4'>
                Configure system-wide settings, maintenance mode, and other administrative options.
              </p>
              <Button
                variant='secondary'
                onClick={() => router.push('/settings')}
                className='w-full'
              >
                System Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
