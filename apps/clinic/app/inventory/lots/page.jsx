'use client';

import { EyeIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        <div className='tab-content-wide-width'>
          {/* Sub-tabs */}
          <div className='data-tabs-content mb-6'>
            <Tabs
              variant='pills'
              tabs={[
                { id: 'all', label: 'All Lots', count: lots.length },
                { id: 'expiringSoon', label: 'Expiring Soon', count: expiringSoonCount },
                { id: 'expired', label: 'Expired', count: expiredCount },
              ]}
              activeTab={filter}
              onChange={setFilter}
              idPrefix='inventory-lots-tabs'
              ariaLabel={t('inventory.inventoryLots')}
            />
          </div>

          <div
            role='tabpanel'
            id={`inventory-lots-tabs-panel-${filter}`}
            aria-labelledby={`inventory-lots-tabs-tab-${filter}`}
          >
            {/* Tab content: standard inline loader when loading (filter/tab change) */}
            {loading ? (
              <div
                className='tab-content-loading'
                aria-busy='true'
                aria-label={t('common.loading')}
              >
                <Loader type='section' text={t('common.loading')} />
              </div>
            ) : lots.length === 0 ? (
              <div className='bg-white rounded-lg border border-neutral-200 p-8 text-center'>
                <p className='text-neutral-600'>No lots found</p>
              </div>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Batch Number</th>
                      <th>Quantity</th>
                      <th>Expiry Date</th>
                      <th>Supplier</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((lot) => (
                      <tr key={lot._id}>
                        <td>
                          <div>
                            <div className='font-medium'>{lot.itemName}</div>
                            {lot.itemCode && (
                              <div className='text-xs text-neutral-500'>{lot.itemCode}</div>
                            )}
                          </div>
                        </td>
                        <td className='font-mono'>{lot.batchNumber}</td>
                        <td>
                          {lot.quantity} {lot.unit}
                        </td>
                        <td>{formatDate(lot.expiryDate)}</td>
                        <td className='text-neutral-600'>{lot.supplierName || 'N/A'}</td>
                        <td>{getStatusBadge(lot)}</td>
                        <td>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/inventory/items/${lot.itemId}`)}
                            className='p-2 min-w-[2.25rem]'
                            title={t('inventory.viewItem')}
                            aria-label={t('inventory.viewItem')}
                          >
                            <EyeIcon className='icon icon-sm' ariaHidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
