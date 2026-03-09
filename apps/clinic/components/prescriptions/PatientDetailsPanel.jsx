'use client';

import '@/app/prescriptions/styles/prescription-form.css';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client.js';
import { getPatientDisplayName } from '@/lib/utils/patient-display-name';
import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/utils/logger.js';

export function PatientDetailsPanel({ patientId }) {
  const { t, locale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const localeCode = (settingsLocale || locale || 'en').toString().slice(0, 2);
  const localeForDate = localeCode === 'ar' ? 'ar-SA' : localeCode === 'es' ? 'es-ES' : undefined;

  const getDisplayValue = (str, code) => {
    if (str == null || String(str).trim() === '') return '';
    const s = String(str).trim();
    const c = (code || localeCode).slice(0, 2);
    if (c === 'ar') return transliterateToArabic(s) || s;
    if (c === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
    return s;
  };

  const getPrescriptionStatusLabel = (status) => {
    const map = {
      draft: t('prescriptions.statusDraft'),
      active: t('prescriptions.statusActive'),
      dispensed: t('prescriptions.statusDispensed'),
      cancelled: t('prescriptions.statusCancelled'),
      expired: t('prescriptions.statusExpired'),
    };
    return map[status] || status;
  };

  const getAppointmentStatusLabel = (status) => {
    const map = {
      scheduled: t('appointments.scheduled'),
      confirmed: t('appointments.confirmed'),
      completed: t('appointments.completed'),
      cancelled: t('appointments.cancelled'),
      arrived: t('appointments.arrived'),
      in_progress: t('appointments.inProgress'),
    };
    return map[status] || status;
  };

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
            {t('prescriptions.selectPatientToViewDetails')}
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
            {t('patients.failedToLoadPatient')}
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
        <Button
          type='button'
          variant='ghost'
          onClick={() => setActiveTab('details')}
          className={`patient-details-tab ${
            activeTab === 'details' ? 'patient-details-tab-active' : ''
          }`}
        >
          {t('patients.tabDetails')}
        </Button>
        <Button
          type='button'
          variant='ghost'
          onClick={() => setActiveTab('history')}
          className={`patient-details-tab ${
            activeTab === 'history' ? 'patient-details-tab-active' : ''
          }`}
        >
          {t('patients.tabHistory')}
        </Button>
        <Button
          type='button'
          variant='ghost'
          onClick={() => setActiveTab('visits')}
          className={`patient-details-tab ${
            activeTab === 'visits' ? 'patient-details-tab-active' : ''
          }`}
        >
          {t('patients.tabVisits')} ({appointments.length})
        </Button>
      </div>

      {/* Patient Details Tab */}
      {activeTab === 'details' && (
        <div className='patient-details-content'>
          <div>
            <h3 className='text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4'>
              {getPatientDisplayName(patient, localeCode, t)}
            </h3>
            <div className='space-y-2'>
              <div className='patient-details-field'>
                <span className='patient-details-label'>{t('patients.patientId')}:</span>
                <span className='patient-details-value'>{patient.patientId}</span>
              </div>
              <div className='patient-details-field'>
                <span className='patient-details-label'>{t('patients.age')}:</span>
                <span className='patient-details-value'>
                  {calculateAge(patient.dateOfBirth)} {t('patients.years')}
                </span>
              </div>
              <div className='patient-details-field'>
                <span className='patient-details-label'>{t('patients.gender')}:</span>
                <span className='patient-details-value'>{patient.gender ? getDisplayValue(patient.gender) : ''}</span>
              </div>
              {patient.bloodGroup && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>{t('patients.bloodGroup')}:</span>
                  <span className='patient-details-value'>{getDisplayValue(patient.bloodGroup)}</span>
                </div>
              )}
              <div className='patient-details-field'>
                <span className='patient-details-label'>{t('patients.phoneLabel')}:</span>
                <span className='patient-details-value'>{patient.phone ? getDisplayValue(patient.phone) : ''}</span>
              </div>
              {patient.email && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>{t('patients.emailLabel')}:</span>
                  <span className='patient-details-value'>{getDisplayValue(patient.email)}</span>
                </div>
              )}
              {patient.address && (
                <div className='patient-details-field'>
                  <span className='patient-details-label'>{t('patients.address')}:</span>
                  <span
                    className='patient-details-value'
                    style={{ fontSize: 'var(--text-body-xs)' }}
                  >
                    {[
                      patient.address.city,
                      patient.address.state,
                      patient.address.country,
                    ]
                      .filter(Boolean)
                      .map((part) => getDisplayValue(part))
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {patient.allergies && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title text-status-error dark:text-red-300'>
                {t('patients.allergies')}
              </p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                {getDisplayValue(patient.allergies)}
              </p>
            </div>
          )}

          {patient.currentMedications && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title'>{t('patients.currentMedications')}</p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                {getDisplayValue(patient.currentMedications)}
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
              <p className='patient-details-section-title'>{t('patients.medicalHistory')}</p>
              <p className='text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed'>
                {getDisplayValue(patient.medicalHistory)}
              </p>
            </div>
          ) : (
            <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
              {t('patients.noMedicalHistoryRecorded')}
            </p>
          )}

          {prescriptions.length > 0 && (
            <div className='patient-details-section'>
              <p className='patient-details-section-title'>{t('prescriptions.recentPrescriptions')}</p>
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
                      {new Date(pres.createdAt).toLocaleDateString(localeForDate)} - {getPrescriptionStatusLabel(pres.status)}
                    </p>
                    <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                      {t('prescriptions.itemsCount', { count: pres.items?.length || 0 })}
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
                        {new Date(apt.appointmentDate).toLocaleDateString(localeForDate)}
                      </p>
                      <p className='text-xs text-neutral-600 dark:text-neutral-300'>
                        {apt.type ? getDisplayValue(apt.type) : ''}
                      </p>
                      {apt.reason && (
                        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                          {getDisplayValue(apt.reason)}
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
                      {getAppointmentStatusLabel(apt.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-neutral-500 dark:text-neutral-400 text-center py-4'>
              {t('patients.noPreviousVisits')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
