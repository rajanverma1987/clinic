'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Table } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaVideo, FaCalendar } from 'react-icons/fa';

export default function TelemedicinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/telemedicine/sessions');
      if (response.success && response.data) {
        setSessions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'default',
      IN_PROGRESS: 'success',
      COMPLETED: 'default',
      CANCELLED: 'danger',
    };
    return colors[status] || 'default';
  };

  const handleJoinSession = (sessionId) => {
    router.push(`/telemedicine/${sessionId}`);
  };

  const columns = [
    {
      header: 'Session ID',
      accessor: (row) => <span className='font-mono text-sm'>{row.sessionId}</span>,
    },
    {
      header: 'Patient',
      accessor: (row) =>
        `${row.patientId.firstName} ${row.patientId.lastName} (${row.patientId.patientId})`,
    },
    {
      header: 'Doctor',
      accessor: (row) => `Dr. ${row.doctorId.firstName} ${row.doctorId.lastName}`,
    },
    {
      header: 'Type',
      accessor: (row) => <Tag variant='default'>{row.sessionType}</Tag>,
    },
    {
      header: 'Scheduled Time',
      accessor: (row) => new Date(row.scheduledStartTime).toLocaleString(),
    },
    {
      header: 'Status',
      accessor: (row) => <Tag variant={getStatusColor(row.status)}>{row.status}</Tag>,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className='flex gap-2'>
          {row.status === 'SCHEDULED' || row.status === 'IN_PROGRESS' ? (
            <Button size='sm' onClick={() => handleJoinSession(row._id)}>
              Join Session
            </Button>
          ) : (
            <Button
              variant='secondary'
              size='sm'
              onClick={() => router.push(`/telemedicine/${row._id}/summary`)}
            >
              View Summary
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loader fullScreen size='lg' />;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <DashboardHeader
          title='Telemedicine'
          subtitle='Virtual consultations and video calls'
          actionButton={
            <Button onClick={() => router.push('/appointments/new')} variant='primary' size='md'>
              + Book Appointment
            </Button>
          }
        />

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>Today&apos;s Sessions</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {
                      sessions.filter(
                        (s) =>
                          new Date(s.scheduledStartTime).toDateString() ===
                          new Date().toDateString()
                      ).length
                    }
                  </p>
                </div>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <FaVideo className='w-6 h-6 text-primary-600' />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>In Progress</p>
                  <p className='text-2xl font-bold text-secondary-600 mt-1'>
                    {sessions.filter((s) => s.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center'>
                  <div className='w-3 h-3 bg-secondary-500 rounded-full'></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>Scheduled</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {sessions.filter((s) => s.status === 'SCHEDULED').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                  <FaCalendar className='w-6 h-6 text-primary-600' />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-neutral-600'>Completed</p>
                  <p className='text-2xl font-bold text-neutral-900 mt-1'>
                    {sessions.filter((s) => s.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-neutral-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions List */}
          <div className='p-4 border-b border-neutral-200'>
            <h2 className='text-lg font-semibold'>All Sessions</h2>
          </div>

          <Table
            data={sessions}
            columns={columns}
            emptyMessage='No telemedicine sessions found. Schedule your first video consultation!'
          />

        {/* Setup Notice if no sessions */}
        {sessions.length === 0 && !loading && (
          <Card className='mt-6'>
            <div className='p-8 text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-primary-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-neutral-900 mb-2'>
                Get Started with Telemedicine
              </h3>
              <p className='text-neutral-600 mb-6 max-w-md mx-auto'>
                Schedule video consultations from the appointments page. Select &quot;Video
                Consultation&quot; when booking to enable remote care with secure, HIPAA-compliant
                video calls.
              </p>
              <div className='flex gap-4 justify-center'>
                <Button onClick={() => router.push('/appointments/new')}>
                  Book Video Consultation
                </Button>
                <Button variant='secondary' size='md' onClick={() => router.push('/appointments')}>
                  View Appointments
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
