'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { showError } from '@/lib/utils/toast';

export default function QueuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const isInitialMountRef = useRef(true);
  const isFetchingRef = useRef(false);
  const currentDoctorIdRef = useRef('');

  // Set logged-in doctor's ID automatically
  useEffect(() => {
    if (user?.userId) {
      currentDoctorIdRef.current = user.userId;
    }
  }, [user]);

  // Create stable fetch function using useCallback
  const fetchQueue = useCallback(async (showLoading = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams();
      // Always filter by logged-in doctor's ID
      if (currentDoctorIdRef.current) {
        params.append('doctorId', currentDoctorIdRef.current);
      }

      // Fetch active entries (default - excludes completed)
      const activeResponse = await apiClient.get(`/queue?${params}`);
      
      let allEntries = [];
      
      if (activeResponse.success && activeResponse.data) {
        const activeList = Array.isArray(activeResponse.data) 
          ? activeResponse.data 
          : activeResponse.data?.data || [];
        allEntries = [...activeList];
      }

      // If showing completed, also fetch completed entries
      if (showCompleted) {
        const completedParams = new URLSearchParams();
        if (currentDoctorIdRef.current) {
          completedParams.append('doctorId', currentDoctorIdRef.current);
        }
        completedParams.append('status', 'completed');
        
        const completedResponse = await apiClient.get(`/queue?${completedParams}`);
        if (completedResponse.success && completedResponse.data) {
          const completedList = Array.isArray(completedResponse.data) 
            ? completedResponse.data 
            : completedResponse.data?.data || [];
          allEntries = [...allEntries, ...completedList];
        }
      }
      
      setQueueEntries(allEntries);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []); // Empty deps - uses refs for current values

  // Effect: Initial fetch and refetch on doctor change
  useEffect(() => {
    if (authLoading || !user) return;

    // Initial fetch on mount
    if (isInitialMountRef.current) {
      fetchQueue(true);
      isInitialMountRef.current = false;
    } else {
      // Refetch when doctor changes (silent)
      fetchQueue(false);
    }
  }, [authLoading, user, fetchQueue]);

  // Refetch when showCompleted changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchQueue(false);
    }
  }, [showCompleted, authLoading, user, fetchQueue]);

  const handleStatusChange = async (queueId, newStatus) => {
    try {
      const response = await apiClient.put(`/queue/${queueId}/status`, {
        status: newStatus,
      });
      if (response.success) {
        fetchQueue(false); // Silent update after status change
      }
    } catch (error) {
      console.error('Failed to update queue status:', error);
    }
  };

  const formatWaitTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} ${t('queue.minutes')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStartVideo = async (appointment) => {
    try {
      let sessionId = appointment.telemedicineSessionId;
      
      // If no session exists, create one
      if (!sessionId && appointment._id) {
        const response = await apiClient.post('/telemedicine/sessions', {
          appointmentId: appointment._id,
          patientId: appointment.patientId?._id || appointment.patientId,
          doctorId: appointment.doctorId?._id || appointment.doctorId,
          scheduledStartTime: appointment.startTime || new Date(),
          scheduledEndTime: appointment.endTime || new Date(),
          sessionType: 'video',
        });
        
        if (response.success && response.data) {
          sessionId = response.data._id;
          // Update the appointment with the session ID
          await apiClient.put(`/appointments/${appointment._id}`, {
            telemedicineSessionId: sessionId,
          });
        } else {
          showError(response.error?.message || 'Failed to create video session');
          return;
        }
      }
      
      if (sessionId) {
        // Open in new tab with doctor role
        window.open(`/telemedicine/${sessionId}?role=doctor`, '_blank');
      } else {
        showError('Unable to start video session');
      }
    } catch (error) {
      console.error('Failed to start video:', error);
      showError(error.message || 'Failed to start video session');
    }
  };

  const columns = [
    { header: t('queue.queueNumber'), accessor: 'queueNumber' },
    { header: t('queue.position'), accessor: 'position' },
    {
      header: t('appointments.patient'),
      accessor: (row) =>
        `${row.patientId?.firstName || ''} ${row.patientId?.lastName || ''}`,
    },
    {
      header: t('appointments.doctor'),
      accessor: (row) =>
        `${row.doctorId?.firstName || ''} ${row.doctorId?.lastName || ''}`,
    },
    {
      header: 'Type',
      accessor: (row) => (
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
      accessor: (row) => (
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
      accessor: (row) => formatWaitTime(row.estimatedWaitTime),
    },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <div className="flex gap-2">
          {row.status === 'completed' ? (
            <span className="text-sm font-medium text-gray-500">Completed</span>
          ) : row.status === 'in_progress' ? (
            <>
              {row.appointmentId?.isTelemedicine && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleStartVideo(row.appointmentId);
                    }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Video
                  </Button>
                  <Button
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Navigate to prescription page with patient pre-filled
                      const patientId = row.patientId?._id || row.patientId;
                      if (patientId) {
                        router.push(`/prescriptions/new?patientId=${patientId}`);
                      } else {
                        router.push('/prescriptions/new');
                      }
                    }}
                  >
                    {t('appointments.startAppointment')}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="primary"
                className="!bg-green-600 hover:!bg-green-700 text-white border-green-600"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Complete this appointment and remove from queue?')) {
                    handleStatusChange(row._id, 'completed');
                  }
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('queue.markComplete') || 'Mark Complete'}
              </Button>
            </>
          ) : row.appointmentId?.isTelemedicine ? (
            <>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleStartVideo(row.appointmentId);
                }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Video
              </Button>
              <Button
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  // Update queue status to in_progress
                  await handleStatusChange(row._id, 'in_progress');
                  // Navigate to prescription page with patient pre-filled
                  const patientId = row.patientId?._id || row.patientId;
                  if (patientId) {
                    router.push(`/prescriptions/new?patientId=${patientId}`);
                  } else {
                    router.push('/prescriptions/new');
                  }
                }}
              >
                {t('appointments.startAppointment')}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                // Update queue status to in_progress
                await handleStatusChange(row._id, 'in_progress');
                // Navigate to prescription page with patient pre-filled
                const patientId = row.patientId?._id || row.patientId;
                if (patientId) {
                  router.push(`/prescriptions/new?patientId=${patientId}`);
                } else {
                  router.push('/prescriptions/new');
                }
              }}
            >
              {t('appointments.startAppointment')}
            </Button>
          )}
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('queue.queueManagement')}</h1>
          <p className="text-gray-600 mt-2">{t('queue.currentQueue')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2"
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </Button>
          <Button
            onClick={() => fetchQueue(false)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {loading ? t('common.loading') : 'Refresh Queue'}
          </Button>
        </div>
      </div>


      <Card>
        <Table
          data={queueEntries.sort((a, b) => a.position - b.position)}
          columns={columns}
          emptyMessage={t('common.noDataFound')}
        />
      </Card>
    </Layout>
  );

}

