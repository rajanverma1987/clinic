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
import { useCallback, useEffect, useState } from 'react';

const LIMIT = 10;

export function PrescriptionsTab() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { prefetchPrescription } = usePrefetchDetail();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!user || authLoading) return;
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.get('/prescriptions');
      if (response.success && response.data) {
        const list = extractArrayData(response);
        setPrescriptions(Array.isArray(list) ? list.slice(0, LIMIT) : []);
      } else {
        setPrescriptions([]);
      }
    } catch (err) {
      logger.error('Failed to fetch prescriptions (tab)', err);
      setPrescriptions([]);
      setError(err?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, t]);

  useEffect(() => {
    if (!authLoading && user) fetchPrescriptions();
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

  const cardContent = (
    <>
      <div className='section-header flex-wrap gap-3'>
        <h2 className='section-title'>{t('prescriptions.title')}</h2>
        <div className='flex gap-2 ml-auto'>
          <Button variant='secondary' size='sm' href='/prescriptions'>
            {t('dashboard.seeAll')}
          </Button>
          <Button variant='primary' size='sm' href='/prescriptions/new'>
            + {t('prescriptions.createPrescription')}
          </Button>
        </div>
      </div>
      <Table
        data={prescriptions}
        columns={columns}
        onRowClick={(row) => row?._id && router.push(`/prescriptions/${row._id}`)}
        onRowMouseEnter={(row) => row?._id && prefetchPrescription(row._id)}
        emptyMessage={t('common.noDataFound')}
      />
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
          <Button variant='primary' size='md' onClick={() => fetchPrescriptions()}>
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
