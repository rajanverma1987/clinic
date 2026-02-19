'use client';

import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useEffect, useState } from 'react';

/**
 * Compact patient header for prescription creator: name, age, allergies, current meds.
 * Shown at top of form when a patient is selected (Phase 3.1).
 */
export function PrescriptionPatientHeader({ patientId }) {
  const { t } = useI18n();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(`/patients/${patientId}`)
      .then((res) => {
        if (!cancelled && res?.success && res?.data) setPatient(res.data);
        else if (!cancelled) setPatient(null);
      })
      .catch(() => {
        if (!cancelled) setPatient(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (!patientId || loading || !patient) return null;

  const age =
    patient.dateOfBirth &&
    (() => {
      const dob = new Date(patient.dateOfBirth);
      const today = new Date();
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
      return a;
    })();

  const name =
    [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.patientId || '—';
  const allergies = patient.allergies ?? patient.allergiesList ?? '';
  const currentMeds = patient.currentMedications ?? '';

  return (
    <div className='prescription-patient-header'>
      <div className='prescription-patient-header__row'>
        <span className='prescription-patient-header__name'>{name}</span>
        {age != null && (
          <span className='prescription-patient-header__meta'>
            · {t('prescriptions.patientAge', { age })}
          </span>
        )}
      </div>
      {(allergies || currentMeds) && (
        <div className='prescription-patient-header__details'>
          {allergies && (
            <span className='prescription-patient-header__allergies'>
              {t('prescriptions.allergies')}:{' '}
              {typeof allergies === 'string'
                ? allergies
                : Array.isArray(allergies)
                  ? allergies.join(', ')
                  : '—'}
            </span>
          )}
          {currentMeds && (
            <span className='prescription-patient-header__meds'>
              {t('prescriptions.currentMeds')}:{' '}
              {typeof currentMeds === 'string'
                ? currentMeds
                : Array.isArray(currentMeds)
                  ? currentMeds.join(', ')
                  : '—'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
