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
    <div
      className='prescription-patient-header'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: 'var(--color-neutral-50)',
        border: '1px solid var(--color-neutral-200)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-neutral-900)', fontSize: 'var(--text-body-md)' }}>
          {name}
        </span>
        {age != null && (
          <span
            style={{
              fontWeight: 400,
              color: 'var(--color-neutral-600)',
              fontSize: 'var(--text-body-sm)',
            }}
          >
            · {t('prescriptions.patientAge', { age })}
          </span>
        )}
      </div>
      {(allergies || currentMeds) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            fontSize: 'var(--text-body-sm)',
            lineHeight: 1.5,
          }}
        >
          {allergies && (
            <span style={{ color: 'var(--color-status-error)', fontWeight: 500 }}>
              {t('prescriptions.allergies')}:{' '}
              {typeof allergies === 'string'
                ? allergies
                : Array.isArray(allergies)
                  ? allergies.join(', ')
                  : '—'}
            </span>
          )}
          {currentMeds && (
            <span style={{ color: 'var(--color-neutral-700)' }}>
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
