'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { apiClient } from '@/lib/api/client';
import { showError } from '@/lib/utils/toast';

interface AppointmentDetails {
  _id: string;
  patientId: {
    firstName: string;
    lastName: string;
    patientId: string;
    phone?: string;
    email?: string;
  };
  doctorId: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
  isTelemedicine?: boolean;
  telemedicineSessionId?: string;
  telemedicineConsent?: boolean;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : '—';

const formatTime = (value?: string) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function AppointmentDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await apiClient.get<AppointmentDetails>(`/appointments/${params.id}`);
        if (response.success && response.data) {
          setAppointment(response.data);
        } else {
          throw new Error(response.error?.message || 'Appointment not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch appointment details:', err);
        const message =
          err?.message?.includes('not found')
            ? 'Appointment not found'
            : 'Failed to load appointment details';
        setError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [params.id]);

  const patientFullName = useMemo(
    () =>
      appointment
        ? `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim()
        : '',
    [appointment]
  );

  const doctorFullName = useMemo(
    () =>
      appointment
        ? `${appointment.doctorId?.firstName || ''} ${appointment.doctorId?.lastName || ''}`.trim()
        : '',
    [appointment]
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">Loading appointment details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-gray-900 mb-2">Appointment unavailable</p>
              <p className="text-gray-600 mb-6">
                {error || 'We could not find the appointment you were looking for.'}
              </p>
              <Button variant="outline" onClick={() => router.push('/appointments')}>
                Back to Appointments
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Appointment Details</h1>
          <p className="text-gray-600">Appointment ID: {appointment._id}</p>
        </div>
        <Tag
          size="lg"
          variant={
            appointment.status === 'completed'
              ? 'success'
              : appointment.status === 'cancelled'
              ? 'danger'
              : 'default'
          }
        >
          {appointment.status.replace(/_/g, ' ')}
        </Tag>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            <Tag variant="default" size="sm">
              {appointment.patientId?.patientId || 'Unknown ID'}
            </Tag>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <span className="font-medium text-gray-900">Name:</span> {patientFullName || '—'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Phone:</span>{' '}
              {appointment.patientId?.phone || '—'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Email:</span>{' '}
              {appointment.patientId?.email || '—'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Information</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <span className="font-medium text-gray-900">Doctor:</span> {doctorFullName || '—'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Email:</span>{' '}
              {appointment.doctorId?.email || '—'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
            Date
          </h3>
          <p className="text-2xl font-bold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
            Time
          </h3>
          <p className="text-xl font-semibold text-gray-900">
            {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
            Duration
          </h3>
          <p className="text-2xl font-bold text-gray-900">{appointment.duration || 30} mins</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Reason</h3>
          <p className="text-gray-700">{appointment.reason || 'Not provided'}</p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {appointment.notes || 'No additional notes'}
          </p>
        </Card>
      </div>

      {appointment.isTelemedicine && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Telemedicine Session</h3>
              <p className="text-gray-700 mt-2">
                Session ID: <span className="font-mono text-sm">{appointment.telemedicineSessionId || 'Pending'}</span>
              </p>
              <p className="text-gray-700 mt-1">
                Consent: {appointment.telemedicineConsent ? 'Captured' : 'Not captured'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
}

