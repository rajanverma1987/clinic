'use client';

/**
 * Dashboard tab: prescriptions list. Fetches own data; links to full /prescriptions page.
 */
import { PrescriptionsListSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';
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
      accessor: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-body-xs font-medium ${
            row.status === 'active'
              ? 'bg-secondary-100 text-secondary-700'
              : row.status === 'dispensed'
                ? 'bg-primary-100 text-primary-700'
                : row.status === 'draft'
                  ? 'bg-status-warning/20 text-status-warning'
                  : row.status === 'cancelled'
                    ? 'bg-status-error/20 text-status-error'
                    : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      header: t('common.createdAt'),
      accessor: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
    },
  ];

  if (authLoading || !user) {
    return (
      <Card className='p-6'>
        <Loader type='section' text={t('common.loading')} />
      </Card>
    );
  }

  if (loading) {
    return <PrescriptionsListSkeleton />;
  }

  if (error) {
    return (
      <Card className='p-6'>
        <p className='text-status-error text-body-sm mb-3'>{error}</p>
        <Button variant='secondary' size='md' onClick={() => fetchPrescriptions()}>
          {t('common.retry')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between gap-4 mb-4'>
        <h2 className='text-lg font-semibold text-neutral-900'>{t('prescriptions.title')}</h2>
        <div className='flex gap-2'>
          <Link
            href='/prescriptions'
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium min-h-[40px] rounded-lg bg-primary-500 text-white border border-white shadow-[0_0_0_0.5px_var(--color-primary-500)] hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          >
            {t('dashboard.seeAll')}
          </Link>
          <Link
            href='/prescriptions/new'
            className='inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium min-h-[40px] rounded-lg bg-[#15803d] text-white border-2 border-white shadow-[0_0_0_1px_#15803d] hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          >
            + {t('prescriptions.createPrescription')}
          </Link>
        </div>
      </div>
      <Table
        data={prescriptions}
        columns={columns}
        onRowClick={(row) => row?._id && router.push(`/prescriptions/${row._id}`)}
        onRowMouseEnter={(row) => row?._id && prefetchPrescription(row._id)}
        emptyMessage={t('common.noDataFound')}
      />
    </Card>
  );
}
