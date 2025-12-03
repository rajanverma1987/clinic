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
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';

interface QueueEntry {
  _id: string;
  queueNumber: string;
  patientId: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctorId: {
    firstName: string;
    lastName: string;
  };
  appointmentId?: {
    _id: string;
    isTelemedicine: boolean;
    telemedicineSessionId?: string;
  };
  position: number;
  priority: string;
  status: string;
  estimatedWaitTime?: number;
  joinedAt: string;
}

export default function QueuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchQueue();
      // Set up polling for real-time updates
      const cleanup = setupSSE();
      return cleanup || undefined;
    }
  }, [authLoading, user, selectedDoctor]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'waiting',
      });
      if (selectedDoctor) {
        params.append('doctorId', selectedDoctor);
      }

      const response = await apiClient.get<QueueEntry[] | { data: QueueEntry[] }>(`/queue?${params}`);
      if (response.success && response.data) {
        // Handle both array and pagination structure
        const queueList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || [];
        setQueueEntries(Array.isArray(queueList) ? queueList : []);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    const params = new URLSearchParams();
    if (selectedDoctor) {
      params.append('doctorId', selectedDoctor);
    }

    // Note: EventSource doesn't support custom headers, so we'll use polling instead
    // For production, consider using a WebSocket library or implementing token in query params
    const pollInterval = setInterval(() => {
      fetchQueue();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  };

  const handleStatusChange = async (queueId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/queue/${queueId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        fetchQueue();
      }
    } catch (error) {
      console.error('Failed to update queue status:', error);
    }
  };

  const formatWaitTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} ${t('queue.minutes')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartVideo = (sessionId: string) => {
    router.push(`/telemedicine/${sessionId}`);
  };

  const columns = [
    { header: t('queue.queueNumber'), accessor: 'queueNumber' as keyof QueueEntry },
    { header: t('queue.position'), accessor: 'position' as keyof QueueEntry },
    {
      header: t('appointments.patient'),
      accessor: (row: QueueEntry) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('appointments.doctor'),
      accessor: (row: QueueEntry) =>
        `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
    },
    {
      header: 'Type',
      accessor: (row: QueueEntry) => (
        <div className="flex items-center gap-2">
          {row.appointmentId?.isTelemedicine ? (
            <Tag variant="default" className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </Tag>
          ) : (
            <Tag variant="success" className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              In-Person
            </Tag>
          )}
        </div>
      ),
    },
    {
      header: t('queue.priority'),
      accessor: (row: QueueEntry) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.priority === 'urgent'
              ? 'bg-red-100 text-red-800'
              : row.priority === 'high'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      header: t('queue.estimatedWait'),
      accessor: (row: QueueEntry) => formatWaitTime(row.estimatedWaitTime),
    },
    {
      header: t('common.actions'),
      accessor: (row: QueueEntry) => (
        <div className="flex gap-2">
          {row.appointmentId?.isTelemedicine && row.appointmentId?.telemedicineSessionId ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                handleStartVideo(row.appointmentId.telemedicineSessionId!);
              }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Video
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(row._id, 'called');
              }}
            >
              {t('queue.callNext')}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(row._id, 'in_progress');
            }}
          >
            {t('queue.markInProgress')}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('queue.queueManagement')}</h1>
        <p className="text-gray-600 mt-2">{t('queue.currentQueue')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('queue.waiting')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {queueEntries.filter((q) => q.status === 'waiting').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Called</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {queueEntries.filter((q) => q.status === 'called').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('queue.inProgress')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {queueEntries.filter((q) => q.status === 'in_progress').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('queue.selectDoctor')}</label>
          <SearchBar
            placeholder={t('queue.allDoctors')}
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full"
          />
        </div>

        <Table
          data={queueEntries.sort((a, b) => a.position - b.position)}
          columns={columns}
          emptyMessage={t('common.noDataFound')}
        />
      </Card>
    </Layout>
  );
}

