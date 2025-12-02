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
    isTelemedicine: false,
    telemedicineConsent: false,
    patientEmail: '',
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

      // Validate telemedicine requirements
      if (formData.isTelemedicine) {
        if (!formData.telemedicineConsent) {
          setError('Please confirm patient consent for video consultation');
          setSubmitting(false);
          return;
        }
        if (!formData.patientEmail) {
          setError('Patient email is required for video consultations');
          setSubmitting(false);
          return;
        }
      }

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationMinutes,
        type: formData.type,
        isTelemedicine: formData.isTelemedicine,
        telemedicineConsent: formData.telemedicineConsent,
        patientEmail: formData.patientEmail || undefined,
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

          {/* Consultation Type - Video or In-Person */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Consultation Method *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isTelemedicine: false, telemedicineConsent: false })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  !formData.isTelemedicine
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    !formData.isTelemedicine ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <svg className={`w-6 h-6 ${!formData.isTelemedicine ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">In-Person Visit</div>
                    <div className="text-sm text-gray-600">Patient visits clinic</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isTelemedicine: true })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.isTelemedicine
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    formData.isTelemedicine ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <svg className={`w-6 h-6 ${formData.isTelemedicine ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Video Consultation</div>
                    <div className="text-sm text-gray-600">Remote via video call</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Telemedicine Email & Consent - HIPAA/GDPR Compliance */}
          {formData.isTelemedicine && (
            <div className="md:col-span-2 space-y-4">
              {/* Email Address for Video Link */}
              <div>
                <Input
                  label="Patient Email Address *"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  required
                  placeholder="patient@example.com"
                />
                <p className="text-sm text-gray-600 mt-1">
                  📧 An email with the secure video consultation link will be sent to this address
                </p>
              </div>

              {/* Compliance Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Video Consultation - Privacy & Compliance
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1 mb-3">
                      <li>• Video calls are encrypted end-to-end</li>
                      <li>• Sessions are HIPAA and GDPR compliant</li>
                      <li>• Data is stored securely on our servers</li>
                      <li>• Patient consent is required and recorded</li>
                      <li>• All sessions are logged for compliance</li>
                      <li>• Automated email will be sent with session details</li>
                    </ul>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.telemedicineConsent}
                        onChange={(e) => setFormData({ ...formData, telemedicineConsent: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required={formData.isTelemedicine}
                      />
                      <span className="ml-2 text-sm font-medium text-blue-900">
                        Patient consents to video consultation and understands their rights under HIPAA/GDPR *
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

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

