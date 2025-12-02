'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { DatePicker } from '@/components/ui/DatePicker';

interface Appointment {
  _id: string;
  patientId: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctorId: {
    firstName: string;
    lastName: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  isTelemedicine?: boolean;
  telemedicineSessionId?: string;
}

interface PaginationResult {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, router, currentPage, dateFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        date: dateFilter,
      });

      const response = await apiClient.get<PaginationResult>(`/appointments?${params}`);
      if (response.success && response.data) {
        setAppointments(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      header: t('appointments.patient'),
      accessor: (row: Appointment) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('appointments.doctor'),
      accessor: (row: Appointment) =>
        `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
    },
    {
      header: t('appointments.date'),
      accessor: (row: Appointment) => new Date(row.appointmentDate).toLocaleDateString(),
    },
    {
      header: t('appointments.time'),
      accessor: (row: Appointment) =>
        `${new Date(row.startTime).toLocaleTimeString()} - ${new Date(row.endTime).toLocaleTimeString()}`,
    },
    { header: t('appointments.type'), accessor: 'type' as keyof Appointment },
    {
      header: 'Method',
      accessor: (row: Appointment) => (
        <Tag variant={row.isTelemedicine ? 'default' : 'success'} size="sm" className="flex items-center gap-1 w-fit">
          {row.isTelemedicine ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              In-Person
            </>
          )}
        </Tag>
      ),
    },
    {
      header: t('appointments.status'),
      accessor: (row: Appointment) => {
        const statusVariant = 
          row.status === 'completed' ? 'success' :
          row.status === 'cancelled' ? 'danger' :
          row.status === 'in_progress' || row.status === 'arrived' ? 'primary' :
          'default';
        return (
          <Tag variant={statusVariant} size="sm">
            {getStatusLabel(row.status)}
          </Tag>
        );
      },
    },
    {
      header: t('common.actions'),
      accessor: (row: Appointment) => (
        <div className="flex gap-2">
          {row.status === 'scheduled' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'arrived');
              }}
            >
              {t('appointments.markArrived')}
            </Button>
          )}
          {row.status === 'arrived' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'in_progress');
              }}
            >
              {t('appointments.startAppointment')}
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'completed');
              }}
            >
              {t('appointments.completeAppointment')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Redirecting to login...</div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('appointments.title')}</h1>
            <p className="text-gray-600 mt-2">{t('appointments.appointmentList')}</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('appointments.title')}</h1>
          <p className="text-gray-600 mt-2">{t('appointments.appointmentList')}</p>
        </div>
        <Button onClick={() => router.push('/appointments/new')}>+ {t('appointments.bookAppointment')}</Button>
      </div>

      <Card className="mb-6">
        <div className="flex gap-4 items-end">
          <DatePicker
            label={t('appointments.selectDate')}
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-auto"
          />
        </div>
      </Card>

      <Card>
        <Table
          data={appointments}
          columns={columns}
          onRowClick={(row) => router.push(`/appointments/${row._id}`)}
          emptyMessage={t('common.noDataFound')}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>
    </Layout>
  );
}

