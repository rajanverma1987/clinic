'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { SearchBar } from '@/components/ui/SearchBar';

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
  position: number;
  priority: string;
  status: string;
  estimatedWaitTime?: number;
  joinedAt: string;
}

export default function QueuePage() {
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

      const response = await apiClient.get<QueueEntry[]>(`/queue?${params}`);
      if (response.success && response.data) {
        setQueueEntries(Array.isArray(response.data) ? response.data : []);
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
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(row._id, 'called');
            }}
          >
            {t('queue.callNext')}
          </Button>
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

