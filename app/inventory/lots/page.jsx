'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

import { logger } from '@/lib/utils/logger';
export default function LotsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { locale } = useSettings();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, expiringSoon, expired

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    fetchLots();
  }, [authLoading, user, router, filter]);

  const fetchLots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'expiringSoon') {
        params.append('expiringSoon', 'true');
      } else if (filter === 'expired') {
        params.append('expired', 'true');
      }

      const response = await apiClient.get(`/inventory/lots?${params.toString()}`);
      if (response.success) {
        setLots(response.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch lots:', error);
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(locale || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (lot) => {
    if (lot.isExpired) {
      return (
        <span className='px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700'>
          Expired
        </span>
      );
    }
    if (lot.isExpiringSoon) {
      return (
        <span className='px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700'>
          Expiring Soon ({lot.daysUntilExpiry} days)
        </span>
      );
    }
    return (
      <span className='px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700'>
        Active
      </span>
    );
  };

  if (authLoading) {
    return (
      <Layout>
        <Loader type='page' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const expiringSoonCount = lots.filter((l) => l.isExpiringSoon && !l.isExpired).length;
  const expiredCount = lots.filter((l) => l.isExpired).length;
  const activeCount = lots.filter((l) => !l.isExpired && !l.isExpiringSoon).length;

  return (
    <Layout>
      <PageHeader
        title={t('inventory.inventoryLots')}
        subtitle={t('inventory.inventoryLotsSubtitle')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='data-tabs-container w-full'>
        {/* Sub-tabs: full width */}
        <div className='data-tabs-content mb-6'>
          <Tabs
            tabs={[
              { id: 'all', label: 'All Lots', count: lots.length },
              { id: 'expiringSoon', label: 'Expiring Soon', count: expiringSoonCount },
              { id: 'expired', label: 'Expired', count: expiredCount },
            ]}
            activeTab={filter}
            onChange={setFilter}
          />
        </div>

        {/* Tab content: standard inline loader when loading (filter/tab change) */}
        {loading ? (
          <div className='tab-content-loading' aria-busy='true' aria-label={t('common.loading')}>
            <Loader type='section' text={t('common.loading')} />
          </div>
        ) : lots.length === 0 ? (
          <div className='bg-white rounded-lg border border-neutral-200 p-8 text-center'>
            <p className='text-neutral-600'>No lots found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-neutral-200 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-neutral-50 border-b border-neutral-200'>
                  <tr>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Item Name
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Batch Number
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Quantity
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Expiry Date
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Supplier
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Status
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-neutral-700'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-neutral-200'>
                  {lots.map((lot) => (
                    <tr
                      key={lot._id}
                      className='hover:bg-neutral-50 transition-colors'
                    >
                      <td className='px-4 py-3'>
                        <div>
                          <div className='font-medium text-neutral-900'>{lot.itemName}</div>
                          {lot.itemCode && (
                            <div className='text-xs text-neutral-500'>{lot.itemCode}</div>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm text-neutral-700 font-mono'>
                        {lot.batchNumber}
                      </td>
                      <td className='px-4 py-3 text-sm text-neutral-700'>
                        {lot.quantity} {lot.unit}
                      </td>
                      <td className='px-4 py-3 text-sm text-neutral-700'>
                        {formatDate(lot.expiryDate)}
                      </td>
                      <td className='px-4 py-3 text-sm text-neutral-600'>
                        {lot.supplierName || 'N/A'}
                      </td>
                      <td className='px-4 py-3'>{getStatusBadge(lot)}</td>
                      <td className='px-4 py-3'>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={() => router.push(`/inventory/items/${lot.itemId}`)}
                        >
                          View Item
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

