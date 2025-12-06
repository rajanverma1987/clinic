'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useFeatures } from '@/hooks/useFeatures.js';
import { apiClient } from '@/lib/api/client';
import { showSuccess, showError, showWarning } from '@/lib/utils/toast';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { PatientSelector } from '@/components/ui/PatientSelector';

function NewAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { hasFeature } = useFeatures();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  
  // Check if telemedicine is available in subscription
  const hasTelemedicine = hasFeature('Telemedicine');
  
  // Get URL query parameters
  const patientIdFromUrl = searchParams?.get('patientId') || '';
  const doctorIdFromUrl = searchParams?.get('doctorId') || '';
  const dateFromUrl = searchParams?.get('date') || '';
  const startTimeFromUrl = searchParams?.get('startTime') || '';
  const endTimeFromUrl = searchParams?.get('endTime') || '';
  
  // Calculate duration from start and end time if provided
  const calculateDuration = (startTime, endTime) => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMinutes = Math.round((end - start) / (1000 * 60));
      return diffMinutes.toString();
    }
    return '30';
  };
  
  // Extract time from ISO string (HH:mm format)
  const extractTimeFromISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    patientId: patientIdFromUrl, // Pre-fill from URL if provided
    doctorId: doctorIdFromUrl, // Pre-fill from URL if provided
    appointmentDate: dateFromUrl, // Pre-fill from URL if provided
    startTime: extractTimeFromISO(startTimeFromUrl), // Extract time in HH:mm format
    duration: calculateDuration(startTimeFromUrl, endTimeFromUrl),
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

  // Update form data when URL parameters change or when data is loaded
  useEffect(() => {
    if (patientIdFromUrl && patients.length > 0) {
      // Verify patient exists in the list before setting
      const patientExists = patients.some(p => p._id === patientIdFromUrl);
      if (patientExists) {
        const patient = patients.find(p => p._id === patientIdFromUrl);
        setFormData(prev => ({ 
          ...prev, 
          patientId: patientIdFromUrl,
          // Auto-populate email if Video Consultation is selected
          patientEmail: formData.isTelemedicine && patient?.email ? patient.email : prev.patientEmail
        }));
      }
    }
  }, [patientIdFromUrl, patients]);

  // Auto-populate patient email when patient is selected and Video Consultation is enabled
  useEffect(() => {
    if (formData.patientId && formData.isTelemedicine && patients.length > 0) {
      const selectedPatient = patients.find(p => p._id === formData.patientId || p.id === formData.patientId);
      if (selectedPatient?.email) {
        // Always update email from patient collection when Video Consultation is enabled
        setFormData(prev => ({ ...prev, patientEmail: selectedPatient.email }));
      }
    }
  }, [formData.patientId, formData.isTelemedicine, patients]);

  // Update doctorId when URL parameter changes or when doctors are loaded
  useEffect(() => {
    if (doctorIdFromUrl && doctors.length > 0) {
      // Verify doctor exists in the list before setting
      const doctorExists = doctors.some(d => d.id === doctorIdFromUrl || d._id === doctorIdFromUrl);
      if (doctorExists) {
        setFormData(prev => ({ ...prev, doctorId: doctorIdFromUrl }));
      }
    }
  }, [doctorIdFromUrl, doctors]);

  // Update date and time when URL parameters change
  useEffect(() => {
    if (dateFromUrl) {
      setFormData(prev => ({ ...prev, appointmentDate: dateFromUrl }));
    }
    if (startTimeFromUrl) {
      // Extract time in HH:mm format for the time input
      const timeStr = extractTimeFromISO(startTimeFromUrl);
      setFormData(prev => ({ ...prev, startTime: timeStr }));
      
      // Update duration if endTime is also provided
      if (endTimeFromUrl) {
        const duration = calculateDuration(startTimeFromUrl, endTimeFromUrl);
        setFormData(prev => ({ ...prev, duration }));
      }
    }
  }, [dateFromUrl, startTimeFromUrl, endTimeFromUrl]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients with pagination
      const patientsResponse = await apiClient.get('/patients?limit=1000'); // Get more patients for appointment booking
      
      if (patientsResponse.success && patientsResponse.data) {
        // Handle pagination structure - data is inside response.data.data
        const patientsList = patientsResponse.data.data || [];
        setPatients(Array.isArray(patientsList) ? patientsList : []);
      }

      // Fetch all doctors and clinic admins (anyone who can conduct appointments)
      const doctorsResponse = await apiClient.get('/users'); // Fetch all users, we'll filter on frontend
      
      if (doctorsResponse.success && doctorsResponse.data) {
        const allUsers = doctorsResponse.data.data || [];
        
        console.log('Fetched users:', allUsers); // Debug log
        
        // Filter to only show active doctors and clinic admins
        const doctorsList = allUsers.filter(
          (u) =>
            (u.role === 'doctor' || u.role === 'clinic_admin') && u.isActive
        );
        
        console.log('Filtered doctors:', doctorsList); // Debug log
        
        setDoctors(doctorsList);
        
        // Pre-select doctor from URL if provided, otherwise use current user
        if (doctorIdFromUrl) {
          const urlDoctor = doctorsList.find((d) => 
            d.id === doctorIdFromUrl || d._id === doctorIdFromUrl
          );
          if (urlDoctor) {
            setFormData(prev => ({ ...prev, doctorId: urlDoctor.id || urlDoctor._id }));
          }
        } else if (currentUser?.role === 'doctor' || currentUser?.role === 'clinic_admin') {
          // Only pre-select current user if no doctorId from URL
          const currentDoctor = doctorsList.find((d) => 
            d.id === currentUser.userId || d._id === currentUser.userId
          );
          if (currentDoctor) {
            setFormData(prev => ({ ...prev, doctorId: currentDoctor.id || currentDoctor._id }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.patientId) {
        showError('Please select a patient');
        setSubmitting(false);
        return;
      }

      if (!formData.doctorId) {
        showError('Please select a doctor');
        setSubmitting(false);
        return;
      }

      if (!formData.appointmentDate) {
        showError('Please select an appointment date');
        setSubmitting(false);
        return;
      }

      if (!formData.startTime) {
        showError('Please select a start time');
        setSubmitting(false);
        return;
      }

      // Calculate end time from start time and duration
      const startDateTime = new Date(`${formData.appointmentDate}T${formData.startTime}`);
      const durationMinutes = parseInt(formData.duration);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // Validate telemedicine requirements
      if (formData.isTelemedicine) {
        if (!formData.telemedicineConsent) {
          showWarning('Please confirm patient consent for video consultation');
          setSubmitting(false);
          return;
        }
        if (!formData.patientEmail) {
          showWarning('Patient email is required for video consultations');
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
        showSuccess(
          formData.isTelemedicine 
            ? 'Video consultation scheduled! Email sent to patient.' 
            : 'Appointment scheduled successfully!'
        );
        setTimeout(() => {
          router.push('/appointments');
        }, 1500);
      } else {
        // User-friendly error messages
        const errorMsg = response.error?.message || 'Failed to create appointment';
        
        // Replace technical errors with user-friendly messages
        if (errorMsg.includes('Cast to ObjectId failed') || errorMsg.includes('ObjectId')) {
          showError('Invalid selection. Please refresh the page and try again.');
        } else if (errorMsg.includes('validation') || errorMsg.includes('required')) {
          showError('Please fill in all required fields correctly');
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('exists')) {
          showError('An appointment already exists for this time slot');
        } else {
          showError(errorMsg);
        }
      }
    } catch (error) {
      console.error('Appointment creation error:', error);
      
      // User-friendly error messages for exceptions
      let errorMsg = 'Failed to create appointment. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Cast to ObjectId') || error.message.includes('ObjectId')) {
          errorMsg = 'Invalid selection. Please refresh the page and try again.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timeout. Please try again.';
        } else if (!error.message.includes('MongoDB') && !error.message.includes('Schema')) {
          // Only show non-technical errors
          errorMsg = error.message;
        }
      }
      
      showError(errorMsg);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <PatientSelector
                patients={patients}
                selectedPatientId={formData.patientId}
                onSelect={(patientId) => {
                  // Find the selected patient to get their email
                  const selectedPatient = patients.find(p => p._id === patientId || p.id === patientId);
                  setFormData(prev => ({ 
                    ...prev, 
                    patientId,
                    // Auto-populate email if Video Consultation is enabled
                    patientEmail: formData.isTelemedicine && selectedPatient?.email 
                      ? selectedPatient.email 
                      : prev.patientEmail
                  }));
                }}
                onAddNew={() => router.push('/patients')}
                label={t('appointments.patient')}
                required
                placeholder="Search by name, ID, or phone number..."
              />
            </div>

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
                    value: doctor.id, // Use 'id' field from API
                    label: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                  })),
                ]}
              />
              {doctors.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No doctors available. Add doctors in Settings → Doctors & Staff.
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
            
            {/* If Telemedicine not available, show only In-Person (disabled) */}
            {!hasTelemedicine ? (
              <div>
                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg opacity-75 cursor-not-allowed">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-600">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">In-Person Visit</div>
                      <div className="text-sm text-gray-600">Patient visits clinic</div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      ✓ Selected
                    </div>
                  </div>
                </div>
                
                {/* Upgrade Notice */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Video Consultations Not Available
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Upgrade your subscription to enable secure video consultations with patients remotely.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/subscription')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Show both options if Telemedicine is available */
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
                  onClick={() => {
                    // When Video Consultation is selected, auto-populate email from patient
                    const selectedPatient = patients.find(p => 
                      p._id === formData.patientId || p.id === formData.patientId
                    );
                    setFormData(prev => ({ 
                      ...prev, 
                      isTelemedicine: true,
                      // Auto-populate email from patient collection
                      patientEmail: selectedPatient?.email || prev.patientEmail
                    }));
                  }}
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
            )}
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

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    }>
      <NewAppointmentPageContent />
    </Suspense>
  );
}

