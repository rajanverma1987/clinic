'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, cancelled
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    doctorId: '',
    status: '',
    searchQuery: '',
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/doctors/search?limit=100');
      if (response.success) {
        const doctorsData = extractArrayData(response);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  useEffect(() => {
    filterAppointments();
  }, [appointments, activeTab, filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/appointments?limit=100&sortBy=appointmentDate&sortOrder=desc');
      
      if (response.success) {
        const appointmentsData = extractArrayData(response);
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    
    // Tab-based filtering
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(
          (apt) => ['scheduled', 'confirmed'].includes(apt.status) &&
          new Date(apt.appointmentDate || apt.startTime) >= new Date()
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (apt) => apt.status === 'completed' ||
          (['scheduled', 'confirmed'].includes(apt.status) &&
           new Date(apt.appointmentDate || apt.startTime) < new Date())
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((apt) => apt.status === 'cancelled');
        break;
    }
    
    // Additional filters
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (apt) => new Date(apt.appointmentDate || apt.startTime) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (apt) => new Date(apt.appointmentDate || apt.startTime) <= new Date(filters.dateTo)
      );
    }
    if (filters.doctorId) {
      filtered = filtered.filter((apt) => apt.doctorId?._id === filters.doctorId);
    }
    if (filters.status) {
      filtered = filtered.filter((apt) => apt.status === filters.status);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctorId?.userId?.firstName?.toLowerCase().includes(query) ||
          apt.doctorId?.userId?.lastName?.toLowerCase().includes(query) ||
          apt.appointmentNumber?.toLowerCase().includes(query) ||
          apt.reason?.toLowerCase().includes(query)
      );
    }
    
    setFilteredAppointments(filtered);
  };

  const downloadPrescription = async (appointmentId) => {
    try {
      const response = await apiClient.get(`/prescriptions?appointmentId=${appointmentId}`, {
        responseType: 'blob',
      });
      if (response.success) {
        // Handle prescription download
        const prescriptions = extractArrayData(response);
        if (prescriptions && prescriptions.length > 0) {
          router.push(`/patient-portal/prescriptions/${prescriptions[0]._id}`);
        } else {
          alert('No prescription found for this appointment');
        }
      }
    } catch (err) {
      alert('Failed to download prescription');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancel = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: 'cancelled',
      });

      if (response.success) {
        alert('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment');
    }
  };

  const handleReschedule = (appointmentId) => {
    router.push(`/patient-portal/appointments/book?appointmentId=${appointmentId}&reschedule=true`);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/patient-portal/dashboard' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>C</span>
              </div>
              <span className='text-xl font-bold text-neutral-900'>ClinicTool</span>
            </Link>
            <div className='flex items-center gap-4'>
              <Link href='/patient-portal/appointments/book'>
                <Button variant='primary' size='sm'>
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-neutral-900'>My Appointments</h1>
          <Link href='/patient-portal/appointments/book'>
            <Button variant='primary' size='lg'>
              <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className='p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>Search</label>
              <input
                type='text'
                placeholder='Search by doctor name or ID...'
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>From Date</label>
              <input
                type='date'
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>To Date</label>
              <input
                type='date'
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>Doctor</label>
              <select
                value={filters.doctorId}
                onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              >
                <option value=''>All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.userId?.firstName} {doc.userId?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-xs font-medium text-neutral-700 mb-1'>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              >
                <option value=''>All Status</option>
                <option value='scheduled'>Scheduled</option>
                <option value='confirmed'>Confirmed</option>
                <option value='completed'>Completed</option>
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>
          </div>
          {(filters.dateFrom || filters.dateTo || filters.doctorId || filters.status || filters.searchQuery) && (
            <div className='mt-4 flex items-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setFilters({ dateFrom: '', dateTo: '', doctorId: '', status: '', searchQuery: '' })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className='flex gap-2 mb-6 border-b border-neutral-200'>
          {['upcoming', 'past', 'cancelled'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({appointments.filter((apt) => {
                if (tab === 'upcoming') {
                  return ['scheduled', 'confirmed'].includes(apt.status) &&
                    new Date(apt.appointmentDate || apt.startTime) >= new Date();
                } else if (tab === 'past') {
                  return apt.status === 'completed' ||
                    (['scheduled', 'confirmed'].includes(apt.status) &&
                     new Date(apt.appointmentDate || apt.startTime) < new Date());
                } else {
                  return apt.status === 'cancelled';
                }
              }).length})
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className='space-y-4'>
            {filteredAppointments.map((apt) => (
              <Card key={apt._id} className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex gap-4 flex-1'>
                    <div className='w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      {apt.doctorId?.userId?.profilePhoto ? (
                        <img
                          src={apt.doctorId.userId.profilePhoto}
                          alt={apt.doctorId.userId.firstName}
                          className='w-full h-full object-cover rounded-lg'
                        />
                      ) : (
                        <span className='text-2xl font-bold text-primary-600'>
                          {apt.doctorId?.userId?.firstName?.charAt(0) || 'D'}
                        </span>
                      )}
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-neutral-900 mb-1'>
                        Dr. {apt.doctorId?.userId?.firstName} {apt.doctorId?.userId?.lastName}
                      </h3>
                      <p className='text-neutral-600 mb-2'>
                        {apt.doctorId?.professional?.specialization?.join(', ') ||
                          'General Medicine'}
                      </p>
                      <div className='flex items-center gap-4 text-sm text-neutral-600 mb-2'>
                        <span className='flex items-center gap-1'>
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                          {formatDate(apt.appointmentDate || apt.startTime)}
                        </span>
                        <span className='flex items-center gap-1'>
                          <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                          </svg>
                          {formatTime(apt.startTime)}
                        </span>
                        <span className='flex items-center gap-1'>
                          {apt.isTelemedicine || apt.type === 'video' ? (
                            <>
                              <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                                />
                              </svg>
                              Video Consultation
                            </>
                          ) : (
                            <>
                              <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                />
                              </svg>
                              In-Clinic
                            </>
                          )}
                        </span>
                        {apt.location && (
                          <span className='flex items-center gap-1'>
                            <svg className='icon icon-xs' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                              />
                            </svg>
                            {apt.location}
                          </span>
                        )}
                      </div>
                      {apt.reason && (
                        <p className='text-sm text-neutral-500 mt-2'>
                          <span className='font-medium'>Reason:</span> {apt.reason}
                        </p>
                      )}
                      {apt.appointmentNumber && (
                        <p className='text-xs text-neutral-400 mt-1'>
                          Booking ID: {apt.appointmentNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    <Tag
                      className={
                        apt.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : apt.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : apt.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {apt.status}
                    </Tag>
                    <div className='flex gap-2'>
                      {activeTab === 'upcoming' && (
                        <>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => handleReschedule(apt._id)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => handleCancel(apt._id)}
                          >
                            Cancel
                          </Button>
                          {apt.type === 'video' && (
                            <Button
                              variant='primary'
                              size='sm'
                              onClick={() => router.push(`/telemedicine/${apt._id}`)}
                            >
                              Join Call
                            </Button>
                          )}
                        </>
                      )}
                      {apt.status === 'completed' && (
                        <>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => router.push(`/patient-portal/prescriptions?appointmentId=${apt._id}`)}
                          >
                            View Prescription
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => downloadPrescription(apt._id)}
                          >
                            <svg className='icon icon-xs mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className='p-12 text-center'>
            <p className='text-neutral-500 mb-4'>
              No {activeTab} appointments found
            </p>
            {activeTab === 'upcoming' && (
              <Link href='/patient-portal/appointments/book'>
                <Button variant='primary'>Book Appointment</Button>
              </Link>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
