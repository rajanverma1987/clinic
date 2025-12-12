'use client';

import '@/app/prescriptions/styles/prescription-form.css';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/lib/api/client.js';
import { useEffect, useState } from 'react';

export function PatientDetailsPanel({ patientId }) {
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
      console.error('Failed to fetch patient data:', error);
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
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-neutral-500)' }}>
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
          <Loader size='sm' text='Loading patient details...' />
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
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-status-error)' }}>
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
            <h3
              style={{
                fontSize: 'var(--text-body-md)',
                fontWeight: 700,
                color: 'var(--color-neutral-900)',
                marginBottom: 'var(--space-4)',
              }}
            >
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
              <p
                className='patient-details-section-title'
                style={{ color: 'var(--color-status-error)' }}
              >
                Allergies
              </p>
              <p style={{ fontSize: 'var(--text-body-xs)', color: 'var(--color-neutral-600)' }}>
                {patient.allergies}
              </p>
            </div>
          )}

          {patient.currentMedications && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title'>Current Medications</p>
              <p style={{ fontSize: 'var(--text-body-xs)', color: 'var(--color-neutral-600)' }}>
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
              <p
                style={{
                  fontSize: 'var(--text-body-xs)',
                  color: 'var(--color-neutral-600)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 'var(--text-body-sm-line-height)',
                }}
              >
                {patient.medicalHistory}
              </p>
            </div>
          ) : (
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-neutral-500)',
                textAlign: 'center',
                padding: 'var(--space-4)',
              }}
            >
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
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--color-neutral-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-neutral-200)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--text-body-xs)',
                        fontWeight: 600,
                        color: 'var(--color-neutral-900)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      {pres.prescriptionNumber}
                    </p>
                    <p
                      style={{ fontSize: 'var(--text-body-xs)', color: 'var(--color-neutral-600)' }}
                    >
                      {new Date(pres.createdAt).toLocaleDateString()} - {pres.status}
                    </p>
                    <p
                      style={{ fontSize: 'var(--text-body-xs)', color: 'var(--color-neutral-500)' }}
                    >
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
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--color-neutral-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-200)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: 600,
                          color: 'var(--color-neutral-900)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        {new Date(apt.appointmentDate).toLocaleDateString()}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--text-body-xs)',
                          color: 'var(--color-neutral-600)',
                        }}
                      >
                        {apt.type}
                      </p>
                      {apt.reason && (
                        <p
                          style={{
                            fontSize: 'var(--text-body-xs)',
                            color: 'var(--color-neutral-500)',
                            marginTop: 'var(--space-1)',
                          }}
                        >
                          {apt.reason}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        fontSize: 'var(--text-body-xs)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        ...(apt.status === 'completed'
                          ? {
                              background: 'var(--color-secondary-100)',
                              color: 'var(--color-secondary-700)',
                            }
                          : apt.status === 'in_progress'
                          ? {
                              background: 'var(--color-primary-100)',
                              color: 'var(--color-primary-700)',
                            }
                          : {
                              background: 'var(--color-neutral-100)',
                              color: 'var(--color-neutral-700)',
                            }),
                      }}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-neutral-500)',
                textAlign: 'center',
                padding: 'var(--space-4)',
              }}
            >
              No previous visits
            </p>
          )}
        </div>
      )}
    </div>
  );
}
