'use client';

/**
 * Dashboard tab: prescriptions list. Fetches own data; links to full /prescriptions page.
 */
import { PrescriptionsListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const LIMIT = 10;
const CACHE_TTL_MS = 30000; // 30 seconds cache

// Simple in-memory cache per user
const cache = new Map();

export function PrescriptionsTab() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { prefetchPrescription } = usePrefetchDetail();
  const hasFetchedRef = useRef(false);

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrescriptions = useCallback(async (forceRefresh = false) => {
    if (!user || authLoading) return;
    
    const cacheKey = `prescriptions-tab-${user._id || user.id}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    // Use cache if available and not expired
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      setPrescriptions(cached.data);
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.get('/prescriptions');
      if (response.success && response.data) {
        const list = extractArrayData(response);
        const data = Array.isArray(list) ? list.slice(0, LIMIT) : [];
        setPrescriptions(data);
        // Update cache
        cache.set(cacheKey, { data, timestamp: now });
      } else {
        setPrescriptions([]);
        cache.set(cacheKey, { data: [], timestamp: now });
      }
    } catch (err) {
      logger.error('Failed to fetch prescriptions (tab)', err);
      setPrescriptions([]);
      setError(err?.message || t('common.error'));
    } finally {
      setLoading(false);
      hasFetchedRef.current = true;
    }
  }, [user, authLoading, t]);

  useEffect(() => {
    if (!authLoading && user && !hasFetchedRef.current) {
      fetchPrescriptions();
    }
  }, [authLoading, user, fetchPrescriptions]);

  const getStatusLabel = (status) => {
    const map = {
      draft: t('prescriptions.draft'),
      active: t('prescriptions.active'),
      dispensed: t('prescriptions.dispensed'),
      cancelled: t('prescriptions.cancelled'),
      expired: t('prescriptions.expired'),
    };
    return map[status] || status;
  };

  const columns = [
    { header: t('prescriptions.title') + ' #', accessor: 'prescriptionNumber' },
    {
      header: t('appointments.patient'),
      accessor: (row) =>
        [row.patientId?.firstName, row.patientId?.lastName].filter(Boolean).join(' ') || '—',
    },
    {
      header: t('prescriptions.status'),
      accessor: (row) => {
        const variant =
          row.status === 'active'
            ? 'primary'
            : row.status === 'dispensed'
              ? 'success'
              : row.status === 'draft'
                ? 'warning'
                : row.status === 'cancelled'
                  ? 'danger'
                  : 'default';
        return (
          <Tag variant={variant} size='sm'>
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
    {
      header: t('common.createdAt'),
      accessor: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
    },
  ];

  // Calculate quick stats
  const stats = {
    total: prescriptions.length,
    draft: prescriptions.filter(p => p.status === 'draft').length,
    active: prescriptions.filter(p => p.status === 'active').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
  };

  const cardContent = (
    <>
      <div className='section-header flex-wrap gap-3'>
        <div className='flex items-center gap-3'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>{t('prescriptions.title')}</h2>
        </div>
        <div className='flex gap-2 ml-auto'>
          <Button variant='secondary' size='sm' href='/prescriptions'>
            {t('dashboard.seeAll')}
          </Button>
          <Button variant='primary' size='sm' href='/prescriptions/new'>
            + {t('prescriptions.createPrescription')}
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.total}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('common.total')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-status-warning'>{stats.draft}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('prescriptions.draft')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-primary-600'>{stats.active}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('prescriptions.active')}</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-secondary-600'>{stats.dispensed}</div>
          <div className='text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wide'>{t('prescriptions.dispensed')}</div>
        </div>
      </div>

      <div className='flex-1 overflow-auto'>
        <Table
          data={prescriptions}
          columns={columns}
          onRowClick={(row) => row?._id && router.push(`/prescriptions/${row._id}`)}
          onRowMouseEnter={(row) => row?._id && prefetchPrescription(row._id)}
          emptyMessage={t('common.noDataFound')}
        />
      </div>
    </>
  );

  if (authLoading || !user) {
    return (
      <div className='dashboard-section'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center'>
          <Loader type='section' text={t('common.loading')} />
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='dashboard-section'>
        <PrescriptionsListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className='dashboard-section'>
        <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col justify-center items-center'>
          <div className='empty-state-icon'>
            <svg className='icon icon-lg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-status-error text-body-md font-medium mb-4'>{error}</p>
          <Button variant='primary' size='md' onClick={() => fetchPrescriptions(true)}>
            {t('common.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='dashboard-section'>
      <Card className='dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col'>
        {cardContent}
      </Card>
    </div>
  );
}
