'use client';

import '@/app/prescriptions/styles/prescription-form.css';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client.js';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/utils/logger.js';

export function PatientDetailsPanel({ patientId }) {
  const { t } = useI18n();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    } else {
      setPatient(null);
      setAppointments([]);
      setPrescriptions([]);
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [patientRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        apiClient.get(`/patients/${patientId}`),
        apiClient.get(`/appointments?patientId=${patientId}&limit=10`),
        apiClient.get(`/prescriptions?patientId=${patientId}&limit=10`),
      ]);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        const apts = Array.isArray(appointmentsRes.data)
          ? appointmentsRes.data
          : appointmentsRes.data?.data || [];
        setAppointments(apts);
      }

      if (prescriptionsRes.success && prescriptionsRes.data) {
        const pres = Array.isArray(prescriptionsRes.data)
          ? prescriptionsRes.data
          : prescriptionsRes.data?.data || [];
        setPrescriptions(pres);
      }
    } catch (error) {
      logger.error('Failed to fetch patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <div className='patient-details-panel'>
        <div
          className='patient-details-content'
          style={{ textAlign: 'center', padding: 'var(--space-8)' }}
        >
          <p className='text-sm text-neutral-500 dark:text-neutral-400'>
            Select a patient to view details
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='patient-details-panel'>
        <div
          className='patient-details-content'
          style={{ textAlign: 'center', padding: 'var(--space-8)' }}
        >
          <Loader type='inline' text={t('prescriptions.loadingPatientDetails')} />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className='patient-details-panel'>
        <div
          className='patient-details-content'
          style={{ textAlign: 'center', padding: 'var(--space-8)' }}
        >
          <p className='text-sm text-status-error dark:text-red-300'>
            Failed to load patient details
          </p>
        </div>
      </div>
    );
  }

  const calculateAge = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className='patient-details-panel'>
      {/* Tabs */}
      <div className='patient-details-tabs'>
        <button
          onClick={() => setActiveTab('details')}
          className={`patient-details-tab ${
            activeTab === 'details' ? 'patient-details-tab-active' : ''
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`patient-details-tab ${
            activeTab === 'history' ? 'patient-details-tab-active' : ''
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`patient-details-tab ${
            activeTab === 'visits' ? 'patient-details-tab-active' : ''
          }`}
        >
          Visits ({appointments.length})
        </button>
      </div>

      {/* Patient Details Tab */}
      {activeTab === 'details' && (
        <div className='patient-details-content'>
          <div>
            <h3 className='text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4'>
              {patient.firstName} {patient.lastName}
            </h3>
            <div className='space-y-2'>
              <div className='patient-details-field'>
                <span className='patient-details-label'>Patient ID:</span>
                <span className='patient-details-value'>{patient.patientId}</span>
              </div>
              <div className='patient-details-field'>
                <span className='patient-details-label'>Age:</span>
                <span className='patient-details-value'>
                  {calculateAge(patient.dateOfBirth)} years
                </span>
              </div>
              <div className='patient-details-field'>
                <span className='patient-details-label'>Gender:</span>
                <span className='patient-details-value'>{patient.gender}</span>
              </div>
              {patient.bloodGroup && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>Blood Group:</span>
                  <span className='patient-details-value'>{patient.bloodGroup}</span>
                </div>
              )}
              <div className='patient-details-field'>
                <span className='patient-details-label'>Phone:</span>
                <span className='patient-details-value'>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>Email:</span>
                  <span className='patient-details-value'>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>Address:</span>
                  <span
                    className='patient-details-value'
                    style={{ fontSize: 'var(--text-body-xs)' }}
                  >
                    {patient.address.city && patient.address.state
                      ? `${patient.address.city}, ${patient.address.state}`
                      : patient.address.country || ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {patient.allergies && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title text-status-error dark:text-red-300'>
                Allergies
              </p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                {patient.allergies}
              </p>
            </div>
          )}

          {patient.currentMedications && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title'>Current Medications</p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                {patient.currentMedications}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === 'history' && (
        <div className='patient-details-content'>
          {patient.medicalHistory ? (
            <div>
              <p className='patient-details-section-title'>Medical History</p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed'>
                {patient.medicalHistory}
              </p>
            </div>
          ) : (
            <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
              No medical history recorded
            </p>
          )}

          {prescriptions.length > 0 && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title'>Recent Prescriptions</p>
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--gap-2)',
                }}
              >
                {prescriptions.map((pres) => (
                  <div
                    key={pres._id}
                    className='p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-600'
                  >
                    <p className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
                      {pres.prescriptionNumber}
                    </p>
                    <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                      {new Date(pres.createdAt).toLocaleDateString()} - {pres.status}
                    </p>
                    <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                      {pres.items?.length || 0} items
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visits Tab */}
      {activeTab === 'visits' && (
        <div className='patient-details-content' style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {appointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-2)' }}>
              {appointments.map((apt) => (
                <div
                  key={apt._id}
                  className='p-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-600'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
                        {new Date(apt.appointmentDate).toLocaleDateString()}
                      </p>
                      <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                        {apt.type}
                      </p>
                      {apt.reason && (
                        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                          {apt.reason}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        apt.status === 'completed'
                          ? 'bg-secondary-100 text-secondary-700 dark:bg-green-800 dark:text-green-100'
                          : apt.status === 'in_progress'
                            ? 'bg-primary-100 text-primary-700 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
              No previous visits
            </p>
          )}
        </div>
      )}
    </div>
  );
}
