'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PatientAppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id;
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/appointments/${appointmentId}`);
      if (response.success) {
        setAppointment(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
    } finally {
      setLoading(false);
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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: 'cancelled',
      });

      if (response.success) {
        alert('Appointment cancelled successfully');
        fetchAppointment();
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert('Failed to cancel appointment');
    }
  };

  const handleReschedule = () => {
    router.push(`/patient-portal/appointments/book?appointmentId=${appointmentId}&reschedule=true`);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className='min-h-screen bg-neutral-50 flex items-center justify-center'>
        <Card className='p-8 text-center'>
          <p className='text-neutral-500 mb-4'>Appointment not found</p>
          <Link href='/patient-portal/appointments'>
            <Button variant='primary'>Back to Appointments</Button>
          </Link>
        </Card>
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
          </div>
        </div>
      </header>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl font-bold text-neutral-900'>Appointment Details</h1>
          <div className='flex gap-2'>
            {['scheduled', 'confirmed'].includes(appointment.status) && (
              <>
                <Button variant='secondary' onClick={handleReschedule}>
                  Reschedule
                </Button>
                <Button variant='secondary' onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            )}
            {appointment.type === 'video' && appointment.status === 'confirmed' && (
              <Button
                variant='primary'
                onClick={() => router.push(`/telemedicine/${appointmentId}`)}
              >
                Join Video Call
              </Button>
            )}
          </div>
        </div>

        <Card className='p-6 mb-6'>
          <div className='flex items-start gap-6 mb-6'>
            <div className='w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              {appointment.doctorId?.userId?.profilePhoto ? (
                <img
                  src={appointment.doctorId.userId.profilePhoto}
                  alt={appointment.doctorId.userId.firstName}
                  className='w-full h-full object-cover rounded-lg'
                />
              ) : (
                <span className='text-3xl font-bold text-primary-600'>
                  {appointment.doctorId?.userId?.firstName?.charAt(0) || 'D'}
                </span>
              )}
            </div>
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-neutral-900 mb-2'>
                Dr. {appointment.doctorId?.userId?.firstName} {appointment.doctorId?.userId?.lastName}
              </h2>
              <p className='text-neutral-600 mb-2'>
                {appointment.doctorId?.professional?.specialization?.join(', ') ||
                  'General Medicine'}
              </p>
              <p className='text-sm text-neutral-500'>
                {appointment.doctorId?.professional?.qualification || 'MBBS'}
              </p>
            </div>
            <Tag
              className={
                appointment.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : appointment.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : appointment.status === 'confirmed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {appointment.status}
            </Tag>
          </div>
        </Card>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <Card className='p-6'>
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>Appointment Information</h3>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-neutral-600'>Date</p>
                <p className='font-semibold text-neutral-900'>
                  {formatDate(appointment.appointmentDate || appointment.startTime)}
                </p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Time</p>
                <p className='font-semibold text-neutral-900'>
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Type</p>
                <p className='font-semibold text-neutral-900 capitalize'>
                  {appointment.type === 'video' ? 'Video Consultation' : 'In-Clinic'}
                </p>
              </div>
              <div>
                <p className='text-sm text-neutral-600'>Duration</p>
                <p className='font-semibold text-neutral-900'>{appointment.duration || 30} minutes</p>
              </div>
            </div>
          </Card>

          <Card className='p-6'>
            <h3 className='text-lg font-bold text-neutral-900 mb-4'>Clinic Information</h3>
            <div className='space-y-3'>
              <div>
                <p className='text-sm text-neutral-600'>Clinic Address</p>
                <p className='font-semibold text-neutral-900'>
                  {appointment.clinicId?.address || 'Clinic address not available'}
                </p>
              </div>
              {appointment.reason && (
                <div>
                  <p className='text-sm text-neutral-600'>Reason for Visit</p>
                  <p className='font-semibold text-neutral-900'>{appointment.reason}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {appointment.status === 'completed' && (
          <Card className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-bold text-neutral-900 mb-2'>Prescription</h3>
                <p className='text-neutral-600'>View your prescription from this appointment</p>
              </div>
              <Button
                variant='primary'
                onClick={() => router.push(`/patient-portal/prescriptions?appointmentId=${appointmentId}`)}
              >
                View Prescription
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
