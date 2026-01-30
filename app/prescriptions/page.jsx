'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import * as routeCache from '@/lib/cache/dashboard-cache';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const ROUTE_KEY = 'route_prescriptions';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const tenantId = user?.tenantId ?? null;

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printPrescriptionId, setPrintPrescriptionId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.prescriptions != null) {
      setPrescriptions(cached.prescriptions);
      setLoading(false);
    }
  }, [tenantId]);

  const fetchPrescriptions = useCallback(async () => {
    const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
    if (!hasCache) setLoading(true);
    try {
      const response = await apiClient.get('/prescriptions');
      if (response.success && response.data) {
        const prescriptionsList = extractArrayData(response);
        setPrescriptions(prescriptionsList);
        if (tenantId) routeCache.set(ROUTE_KEY, tenantId, { prescriptions: prescriptionsList });
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      logger.error('Failed to fetch prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [authLoading, user, fetchPrescriptions]);

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: t('prescriptions.draft'),
      active: t('prescriptions.active'),
      dispensed: t('prescriptions.dispensed'),
      cancelled: t('prescriptions.cancelled'),
      expired: t('prescriptions.expired'),
    };
    return statusMap[status] || status;
  };

  const handleEdit = (prescriptionId) => {
    router.push(`/prescriptions/${prescriptionId}/edit`);
  };

  const handlePrint = (prescriptionId) => {
    setPrintPrescriptionId(prescriptionId);
    setShowPrintPreview(true);
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setPrintPrescriptionId(null);
  };

  const handleActivate = async (prescriptionId) => {
    if (!confirm(t('prescriptions.confirmActivate'))) {
      return;
    }

    try {
      const response = await apiClient.post(`/prescriptions/${prescriptionId}/activate`);
      if (response.success) {
        showSuccess(t('prescriptions.activated') || 'Prescription activated successfully');
        // Refresh the prescriptions list
        fetchPrescriptions();
      } else {
        showError(response.error?.message || 'Failed to activate prescription');
      }
    } catch (error) {
      logger.error('Failed to activate prescription:', error);
      showError(error.message || 'Failed to activate prescription');
    }
  };

  const columns = [
    { header: t('prescriptions.title') + ' #', accessor: 'prescriptionNumber' },
    {
      header: t('appointments.patient'),
      accessor: (row) => `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
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
      header: 'Created',
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className='flex gap-2'>
          {row.status === 'draft' && (
            <Button
              variant='primary'
              size='md'
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(row._id);
              }}
              className='whitespace-nowrap'
            >
              {t('prescriptions.activate') || 'Activate'}
            </Button>
          )}
          <Button
            variant='secondary'
            size='md'
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row._id);
            }}
            className='whitespace-nowrap'
          >
            Edit
          </Button>
          <Button
            variant='secondary'
            size='md'
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row._id);
            }}
            className='whitespace-nowrap'
          >
            Print
          </Button>
        </div>
      ),
    },
  ];

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  if (loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  return (
    <Layout>
      <PageHeader
        title={t('prescriptions.title')}
        subtitle={t('prescriptions.prescriptionList')}
        notifications={[]}
        unreadCount={0}
        actionButton={
          <Button
            onClick={() => router.push('/prescriptions/new')}
            variant='primary'
            size='md'
            className='whitespace-nowrap'
          >
            + {t('prescriptions.createPrescription')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <Card>
          <Table
            data={prescriptions}
            columns={columns}
            onRowClick={(row) => router.push(`/prescriptions/${row._id}`)}
            emptyMessage={t('common.noDataFound')}
          />
        </Card>

        <PrescriptionPrintPreview
          prescriptionId={printPrescriptionId}
          isOpen={showPrintPreview}
          onClose={handleClosePrintPreview}
        />
      </div>
    </Layout>
  );
}
