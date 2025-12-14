'use client';

import { Layout } from '@/components/layout/Layout';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { FaEye } from 'react-icons/fa';

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
      console.error('Failed to fetch lots:', error);
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

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
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
      <div style={{ padding: '0 10px' }}>
        <DashboardHeader
          title='Inventory Lots'
          subtitle='Manage and track inventory batches'
        />

        {/* Filter Tabs */}
        <div className='flex gap-2 mb-6' style={{ marginTop: 'var(--space-6)' }}>
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => setFilter('all')}
          >
            All Lots ({lots.length})
          </Button>
          <Button
            variant={filter === 'expiringSoon' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => setFilter('expiringSoon')}
          >
            Expiring Soon ({expiringSoonCount})
          </Button>
          <Button
            variant={filter === 'expired' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => setFilter('expired')}
          >
            Expired ({expiredCount})
          </Button>
        </div>

        {/* Lots Table */}
        {lots.length === 0 ? (
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
                          variant='outline'
                          size='sm'
                          iconOnly
                          onClick={() => router.push(`/inventory/items/${lot.itemId}`)}
                          title='View Item'
                        >
                          <FaEye />
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

