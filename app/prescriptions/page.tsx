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

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  patientId: {
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [authLoading, user]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Prescription[]>('/prescriptions');
      if (response.success && response.data) {
        setPrescriptions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t('prescriptions.active'),
      dispensed: t('prescriptions.dispensed'),
      cancelled: t('prescriptions.cancelled'),
    };
    return statusMap[status] || status;
  };

  const columns = [
    { header: t('prescriptions.title') + ' #', accessor: 'prescriptionNumber' as keyof Prescription },
    {
      header: t('appointments.patient'),
      accessor: (row: Prescription) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('prescriptions.status'),
      accessor: (row: Prescription) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : row.status === 'dispensed'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: (row: Prescription) => new Date(row.createdAt).toLocaleDateString(),
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
    </Layout>
  );
}

