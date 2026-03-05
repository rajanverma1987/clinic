/**
 * Get display name for a patient for the current UI locale.
 * Uses row.patientDisplayName from API when present (locale-aware), else builds from patient object.
 *
 * @param {Object} rowOrPatient - Appointment row (with patientDisplayName, patientId) or patient object
 * @param {string} locale - Two-letter locale: 'en', 'es', 'ar'
 * @param {Function} t - i18n function for fallback (e.g. t('common.unknownPatient'))
 * @returns {string} Display name or translated "Unknown Patient"
 */
export function getPatientDisplayName(rowOrPatient, locale, t) {
  const unknown = t ? t('common.unknownPatient') : '—';
  if (rowOrPatient == null) return unknown;
  if (typeof rowOrPatient === 'object' && rowOrPatient.patientDisplayName != null && String(rowOrPatient.patientDisplayName).trim()) {
    return rowOrPatient.patientDisplayName.trim();
  }
  const patient = typeof rowOrPatient === 'object' && rowOrPatient.patientId != null ? rowOrPatient.patientId : rowOrPatient;
  if (!patient || typeof patient !== 'object') return unknown;
  const appLocale = (locale || 'en').slice(0, 2);
  let first = patient.firstName ?? '';
  let last = patient.lastName ?? '';
  if (appLocale === 'es') {
    first = (patient.firstName_es && String(patient.firstName_es).trim()) || first;
    last = (patient.lastName_es && String(patient.lastName_es).trim()) || last;
  } else if (appLocale === 'ar') {
    first = (patient.firstName_ar && String(patient.firstName_ar).trim()) || first;
    last = (patient.lastName_ar && String(patient.lastName_ar).trim()) || last;
  }
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (!name) return unknown;
  const lower = name.toLowerCase();
  if (lower === 'patient' || lower === 'unknown' || lower === 'unknown patient' || lower === 'n/a') return unknown;
  return name;
}
