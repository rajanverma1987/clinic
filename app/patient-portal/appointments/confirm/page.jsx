'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AppointmentConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
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

  const addToCalendar = () => {
    if (!appointment) return;
    
    const startDate = new Date(appointment.startTime || appointment.appointmentDate);
    const endDate = new Date(appointment.endTime || new Date(startDate.getTime() + 30 * 60000));
    
    // Format dates for calendar (YYYYMMDDTHHMMSS)
    const formatCalendarDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const title = `Appointment with Dr. ${appointment.doctorId?.userId?.firstName || ''} ${appointment.doctorId?.userId?.lastName || ''}`;
    const description = `Appointment Type: ${appointment.type || 'Consultation'}\nReason: ${appointment.reason || 'General Consultation'}`;
    const location = appointment.doctorId?.clinicAddress || appointment.location || '';
    
    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    
    // Open in new tab
    window.open(googleCalendarUrl, '_blank');
  };

  const downloadAppointmentSlip = async () => {
    try {
      // Generate PDF or download appointment slip
      const response = await apiClient.get(`/appointments/${appointmentId}/slip`, {
        responseType: 'blob',
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-${appointment.appointmentNumber || appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: Print the page
      window.print();
    }
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
          <Link href='/patient-portal'>
            <Button variant='primary'>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-neutral-50 py-8'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Success Message */}
        <Card className='p-8 text-center mb-6'>
          <div className='w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg
              className='w-14 h-14 text-green-600'
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

          <h1 className='text-3xl font-bold text-neutral-900 mb-3'>
            Appointment Booked Successfully! 🎉
          </h1>
          <p className='text-lg text-neutral-600 mb-2'>
            Your appointment has been confirmed and scheduled.
          </p>
          <p className='text-sm text-neutral-500'>
            Confirmation details have been sent to your email and phone.
          </p>
        </Card>

        {/* Booking ID - Prominent */}
        <Card className='p-6 mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200'>
          <div className='text-center'>
            <p className='text-sm text-neutral-600 mb-2'>Booking Reference Number</p>
            <p className='text-3xl font-bold text-primary-700 font-mono'>
              {appointment.appointmentNumber || `APT-${appointment._id.slice(-8).toUpperCase()}`}
            </p>
            <p className='text-xs text-neutral-500 mt-2'>
              Please save this number for your records
            </p>
          </div>
        </Card>

        {/* Appointment Details */}
        <Card className='p-6 mb-6'>
          <h2 className='text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2'>
            <svg className='icon icon-md text-primary-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            Appointment Details
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Doctor Info */}
            {appointment.doctorId && (
              <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                <p className='text-xs text-neutral-500 mb-1'>Doctor</p>
                <p className='font-semibold text-neutral-900 text-lg'>
                  Dr. {appointment.doctorId?.userId?.firstName || ''}{' '}
                  {appointment.doctorId?.userId?.lastName || ''}
                </p>
                {appointment.doctorId?.professional?.specialization && (
                  <p className='text-sm text-neutral-600 mt-1'>
                    {appointment.doctorId.professional.specialization.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Date & Time */}
            <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
              <p className='text-xs text-neutral-500 mb-1'>Date & Time</p>
              <p className='font-semibold text-neutral-900'>
                {formatDate(appointment.appointmentDate || appointment.startTime)}
              </p>
              <p className='text-sm text-neutral-700 mt-1'>
                {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </p>
            </div>

            {/* Consultation Type */}
            <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
              <p className='text-xs text-neutral-500 mb-1'>Consultation Type</p>
              <p className='font-semibold text-neutral-900 capitalize'>
                {appointment.isTelemedicine ? 'Video Consultation' : 'In-Clinic Consultation'}
              </p>
            </div>

            {/* Location (if in-clinic) */}
            {!appointment.isTelemedicine && (
              <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                <p className='text-xs text-neutral-500 mb-1'>Location</p>
                <p className='font-semibold text-neutral-900'>
                  {appointment.doctorId?.clinicAddress ||
                    appointment.location ||
                    appointment.doctorId?.professional?.clinicAddress ||
                    'Clinic address'}
                </p>
              </div>
            )}

            {/* Patient Info */}
            <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
              <p className='text-xs text-neutral-500 mb-1'>Patient</p>
              <p className='font-semibold text-neutral-900'>{appointment.patientName || 'N/A'}</p>
              {appointment.patientPhone && (
                <p className='text-sm text-neutral-600 mt-1'>{appointment.patientPhone}</p>
              )}
            </div>

            {/* Fee */}
            {appointment.consultationFee && (
              <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
                <p className='text-xs text-neutral-500 mb-1'>Consultation Fee</p>
                <p className='font-semibold text-neutral-900 text-lg'>${appointment.consultationFee}</p>
                <p className='text-xs text-neutral-500 mt-1'>
                  Payment: {appointment.paymentMethod || 'Pending'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Button variant='primary' size='lg' onClick={addToCalendar} className='w-full'>
            <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            Add to Calendar
          </Button>
          <Button variant='secondary' size='lg' onClick={downloadAppointmentSlip} className='w-full'>
            <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            Download Slip
          </Button>
          <Link href='/patient-portal/dashboard' className='w-full'>
            <Button variant='outline' size='lg' className='w-full'>
              <svg className='icon icon-sm mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Confirmation Messages */}
        <Card className='p-6 bg-green-50 border border-green-200'>
          <div className='flex items-start gap-3'>
            <svg className='icon icon-md text-green-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <div>
              <p className='font-semibold text-green-900 mb-2'>Confirmation Sent</p>
              <p className='text-sm text-green-700 mb-3'>
                ✓ Email confirmation sent to <strong>{appointment.patientEmail || 'your email'}</strong>
              </p>
              <p className='text-sm text-green-700 mb-3'>
                ✓ SMS confirmation sent to <strong>{appointment.patientPhone || 'your phone'}</strong>
              </p>
            </div>
          </div>
        </Card>

        {/* Reminders */}
        <Card className='p-6 bg-blue-50 border border-blue-200 mt-6'>
          <div className='flex items-start gap-3'>
            <svg className='icon icon-md text-blue-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <div>
              <p className='font-semibold text-blue-900 mb-2'>Reminder Schedule</p>
              <ul className='text-sm text-blue-700 space-y-1'>
                <li>• You will receive a reminder 24 hours before your appointment</li>
                <li>• Another reminder will be sent 2 hours before your appointment</li>
                <li>• For video consultations, a link will be sent 30 minutes before</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className='p-6 bg-yellow-50 border border-yellow-200 mt-6'>
          <div className='flex items-start gap-3'>
            <svg className='icon icon-md text-yellow-600 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
            <div>
              <p className='font-semibold text-yellow-900 mb-2'>Important Information</p>
              <ul className='text-sm text-yellow-800 space-y-1'>
                <li>• Please arrive 10 minutes before your scheduled time</li>
                <li>• Cancellation is allowed up to 24 hours before the appointment</li>
                {appointment.isTelemedicine && (
                  <li>• Video consultation link will be sent to your email and phone</li>
                )}
                <li>• Bring a valid ID and insurance card (if applicable)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
