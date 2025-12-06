'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { PrescriptionPrintPreview } from '@/components/prescriptions/PrescriptionPrintPreview';
import { showSuccess, showError } from '@/lib/utils/toast';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printPrescriptionId, setPrintPrescriptionId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [authLoading, user]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/prescriptions');
      if (response.success && response.data) {
        // Handle paginated response structure
        if (response.data.data && Array.isArray(response.data.data)) {
          setPrescriptions(response.data.data);
        } else if (Array.isArray(response.data)) {
          setPrescriptions(response.data);
        } else {
          setPrescriptions([]);
        }
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      draft: 'Draft',
      active: t('prescriptions.active') || 'Active',
      dispensed: t('prescriptions.dispensed') || 'Dispensed',
      cancelled: t('prescriptions.cancelled') || 'Cancelled',
      expired: 'Expired',
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
    if (!confirm('Are you sure you want to activate this prescription?')) {
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
      console.error('Failed to activate prescription:', error);
      showError(error.message || 'Failed to activate prescription');
    }
  };

  const columns = [
    { header: t('prescriptions.title') + ' #', accessor: 'prescriptionNumber' },
    {
      header: t('appointments.patient'),
      accessor: (row) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('prescriptions.status'),
      accessor: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : row.status === 'dispensed'
              ? 'bg-blue-100 text-blue-800'
              : row.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : row.status === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
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
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleActivate(row._id);
              }}
            >
              {t('prescriptions.activate') || 'Activate'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row._id);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(row._id);
            }}
          >
            Print
          </Button>
        </div>
      ),
    },
  ];

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('prescriptions.title')}</h1>
          <p className="text-gray-600 mt-2">{t('prescriptions.prescriptionList')}</p>
        </div>
        <Button onClick={() => router.push('/prescriptions/new')}>+ {t('prescriptions.createPrescription')}</Button>
      </div>

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
    </Layout>
  );
}

