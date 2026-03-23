'use client';

import { CheckIcon, EyeIcon, PencilIcon, PrinterIcon } from '@/components/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { isManagerPathReadOnly } from '@/lib/constants/route-security';
import { ACTIONS, RESOURCES, hasPermission } from '@/lib/permissions/constants';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';

export default function PrescriptionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const localeCode = (i18nLocale || 'en').slice(0, 2);
  const dateLocale =
    localeCode === 'ar' ? 'ar' : localeCode === 'es' ? 'es' : (i18nLocale || 'en-US');
  const { open: openConfirm } = useConfirmation();
  const tenantId = user?.tenantId ?? null;
  const managerReadOnly = isManagerPathReadOnly(pathname);
  const canCreatePrescription = user
    ? hasPermission(user.role, RESOURCES.PRESCRIPTION, ACTIONS.CREATE)
    : false;

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printPrescriptionId, setPrintPrescriptionId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  const fetchPrescriptions = useCallback(async (silentRefresh = false) => {
    if (!silentRefresh) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (localeCode) params.set('locale', localeCode);
      const response = await apiClient.get(`/prescriptions${params.toString() ? `?${params}` : ''}`);
      if (response.success && response.data) {
        const data = response.data;
        let prescriptionsList =
          Array.isArray(data) ? data : data?.data ?? data?.prescriptions ?? extractArrayData(response);
        if (!Array.isArray(prescriptionsList)) prescriptionsList = [];
        setPrescriptions(prescriptionsList);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      logger.error('Failed to fetch prescriptions:', error);
      setPrescriptions([]);
    } finally {
      if (!silentRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, localeCode]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [authLoading, user, fetchPrescriptions]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && user) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchPrescriptions(true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [authLoading, user, fetchPrescriptions]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrescriptions(false);
  }, [fetchPrescriptions]);

  const getStatusLabel = useCallback(
    (status) => {
      const statusMap = {
        draft: t('prescriptions.draft'),
        active: t('prescriptions.active'),
        dispensed: t('prescriptions.dispensed'),
        cancelled: t('prescriptions.cancelled'),
        expired: t('prescriptions.expired'),
      };
      return statusMap[status] || status;
    },
    [t],
  );

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
    openConfirm({
      title: t('prescriptions.activate'),
      message: t('prescriptions.confirmActivate'),
      variant: 'primary',
      onConfirm: async () => {
        try {
          const response = await apiClient.post(`/prescriptions/${prescriptionId}/activate`);
          if (response.success) {
            showSuccess(t('prescriptions.activated'));
            fetchPrescriptions();
          } else {
            showError(response.error?.message || t('prescriptions.failedToActivate'));
          }
        } catch (error) {
          logger.error('Failed to activate prescription:', error);
          showError(error.message || t('prescriptions.failedToActivate'));
        }
      },
    });
  };

  const columns = useMemo(
    () => [
      { header: t('prescriptions.title') + ' #', accessor: 'prescriptionNumber' },
      {
        header: t('appointments.patient'),
        accessor: (row) =>
          row.patientDisplayName ||
          `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`.trim() ||
          '—',
      },
      {
        header: t('prescriptions.status'),
        accessor: (row) => (
          <span
            className={`px-2 py-1 rounded-full text-body-xs font-medium ${
              row.status === 'active'
                ? 'bg-secondary-100 text-secondary-700 dark:bg-green-800 dark:text-green-100'
                : row.status === 'dispensed'
                  ? 'bg-primary-100 text-primary-700 dark:bg-blue-800 dark:text-blue-100'
                  : row.status === 'draft'
                    ? 'bg-status-warning/20 text-status-warning dark:bg-amber-900/60 dark:text-amber-200'
                    : row.status === 'cancelled'
                      ? 'bg-status-error/20 text-status-error dark:bg-red-900/60 dark:text-red-200'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200'
            }`}
          >
            {getStatusLabel(row.status)}
          </span>
        ),
      },
      {
        header: t('common.createdAt'),
        accessor: (row) =>
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—',
      },
      {
        header: t('common.actions'),
        accessor: (row) => {
          const menuItems = [
            {
              key: 'view',
              label: t('common.view'),
              icon: <EyeIcon className='icon icon-sm' />,
              onClick: () => router.push(`/prescriptions/${row._id}`),
            },
            {
              key: 'edit',
              label: t('common.edit'),
              icon: <PencilIcon className='icon icon-sm' />,
              onClick: () => handleEdit(row._id),
            },
            ...(row.status === 'draft'
              ? [
                  {
                    key: 'activate',
                    label: t('prescriptions.activate'),
                    icon: <CheckIcon className='icon icon-sm' />,
                    onClick: () => handleActivate(row._id),
                  },
                ]
              : []),
            {
              key: 'print',
              label: t('prescriptions.print'),
              icon: <PrinterIcon className='icon icon-sm' />,
              onClick: () => handlePrint(row._id),
            },
          ];
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                ariaLabel={t('common.actions')}
                triggerSize='xs'
                items={menuItems}
              />
            </div>
          );
        },
      },
    ],
    [t, getStatusLabel, router, handleEdit, handleActivate, handlePrint, dateLocale],
  );

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

  return (
    <>
      <PageHeader
        title={t('prescriptions.title')}
        subtitle={t('prescriptions.prescriptionList')}
        notifications={[]}
        unreadCount={0}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        actionButton={
          canCreatePrescription ? (
            <Button
              href='/prescriptions/new'
              variant='primary'
              size='md'
              className='whitespace-nowrap'
            >
              + {t('prescriptions.createPrescription')}
            </Button>
          ) : null
        }
      />
      <div style={{ padding: '0 10px' }}>
        {loading ? (
          <Card>
            <TableSkeleton rows={10} cols={5} />
          </Card>
        ) : (
          <Card>
            <Table
              data={prescriptions}
              columns={columns}
              onRowClick={(row) => router.push(`/prescriptions/${row._id}`)}
              emptyMessage={t('common.noDataFound')}
            />
          </Card>
        )}

        <PrescriptionPrintPreview
          prescriptionId={printPrescriptionId}
          isOpen={showPrintPreview}
          onClose={handleClosePrintPreview}
        />
      </div>
    </>
  );
}
