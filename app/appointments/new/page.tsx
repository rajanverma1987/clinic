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
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    duration: '30',
    type: 'consultation',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients
      const patientsResponse = await apiClient.get<Patient[]>('/patients?limit=100');
      if (patientsResponse.success && patientsResponse.data) {
        setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
      }

      // Fetch doctors (users with doctor role)
      // Note: For now, we'll use the current user if they're a doctor
      // TODO: Create a /api/users endpoint to fetch all doctors
      if (currentUser?.role === 'doctor' || currentUser?.role === 'clinic_admin') {
        setDoctors([{
          _id: currentUser.userId,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: currentUser.role,
        }]);
        // Pre-select current user as doctor
        setFormData(prev => ({ ...prev, doctorId: currentUser.userId }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Calculate end time from start time and duration
      const startDateTime = new Date(`${formData.appointmentDate}T${formData.startTime}`);
      const durationMinutes = parseInt(formData.duration);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationMinutes,
        type: formData.type,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      };

      const response = await apiClient.post('/appointments', appointmentData);
      if (response.success) {
        router.push('/appointments');
      } else {
        setError(response.error?.message || t('common.error'));
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

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
        <Button variant="outline" onClick={() => router.back()}>
          ← {t('common.back')}
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('appointments.bookAppointment')}</h1>
        <p className="text-gray-600 mt-2">{t('appointments.appointmentList')}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label={t('appointments.patient')}
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              placeholder={`${t('common.select')} ${t('appointments.patient').toLowerCase()}`}
              options={[
                { value: '', label: `${t('common.select')} ${t('appointments.patient').toLowerCase()}`, disabled: true },
                ...patients.map((patient) => ({
                  value: patient._id,
                  label: `${patient.patientId} - ${patient.firstName} ${patient.lastName} (${patient.phone})`,
                })),
              ]}
            />

            <div>
              <Select
                label={t('appointments.doctor')}
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                required
                placeholder={`${t('common.select')} ${t('appointments.doctor').toLowerCase()}`}
                options={[
                  { value: '', label: `${t('common.select')} ${t('appointments.doctor').toLowerCase()}`, disabled: true },
                  ...doctors.map((doctor) => ({
                    value: doctor._id,
                    label: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                  })),
                ]}
              />
              {doctors.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No doctors available.
                </p>
              )}
            </div>

            <div>
              <DatePicker
                label={t('appointments.selectDate') + ' *'}
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                {t('appointments.time')} *
              </label>
              <Input
                id="startTime"
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <Select
              label={`${t('appointments.duration')} (${t('appointments.minutes')})`}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
              options={[
                { value: '15', label: `15 ${t('appointments.minutes')}` },
                { value: '30', label: `30 ${t('appointments.minutes')}` },
                { value: '45', label: `45 ${t('appointments.minutes')}` },
                { value: '60', label: `60 ${t('appointments.minutes')}` },
                { value: '90', label: `90 ${t('appointments.minutes')}` },
                { value: '120', label: `120 ${t('appointments.minutes')}` },
              ]}
            />

            <Select
              label={t('appointments.appointmentType')}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              options={[
                { value: 'consultation', label: 'Consultation' },
                { value: 'follow_up', label: 'Follow-up' },
                { value: 'checkup', label: 'Checkup' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'procedure', label: 'Procedure' },
                { value: 'lab_test', label: 'Lab Test' },
              ]}
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              {t('appointments.reason')}
            </label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Brief reason for the appointment"
            />
          </div>

          <div>
            <Textarea
              label={t('appointments.notes')}
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the appointment"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {t('appointments.bookAppointment')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

