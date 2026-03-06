import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';

/**
 * Resolve first and last display names for a patient for the given locale.
 * Uses stored _ar/_es when present; otherwise transliterates to Arabic or translates to Spanish (same as item names).
 *
 * @param {Object} patient - Patient object (firstName, lastName, firstName_ar, lastName_ar, firstName_es, lastName_es)
 * @param {string} locale - Two-letter locale: 'en', 'es', 'ar'
 * @returns {{ first: string, last: string }}
 */
export function getPatientDisplayNameParts(patient, locale) {
  const appLocale = (locale || 'en').slice(0, 2);
  let first = String(patient?.firstName ?? '').trim();
  let last = String(patient?.lastName ?? '').trim();
  if (appLocale === 'es') {
    first = (patient?.firstName_es && String(patient.firstName_es).trim()) || (first ? translateToSpanish(first) || first : '');
    last = (patient?.lastName_es && String(patient.lastName_es).trim()) || (last ? translateToSpanish(last) || last : '');
  } else if (appLocale === 'ar') {
    first = (patient?.firstName_ar && String(patient.firstName_ar).trim()) || (first ? transliterateToArabic(first) || first : '');
    last = (patient?.lastName_ar && String(patient.lastName_ar).trim()) || (last ? transliterateToArabic(last) || last : '');
  }
  return { first, last };
}

/**
 * Get display name for a patient for the current UI locale.
 * Uses row.patientDisplayName from API when present (locale-aware), else builds from patient object.
 * When _ar/_es are not set, uses same approach as item names: transliterate to Arabic, translate to Spanish.
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
  // When rowOrPatient is an appointment row, patientId may be a populated patient object; when it's a patient, patientId is a string
  const patient =
    typeof rowOrPatient === 'object' && rowOrPatient.patientId != null && typeof rowOrPatient.patientId === 'object'
      ? rowOrPatient.patientId
      : rowOrPatient;
  if (!patient || typeof patient !== 'object') return unknown;
  const { first, last } = getPatientDisplayNameParts(patient, locale);
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (!name) return unknown;
  const lower = name.toLowerCase();
  if (lower === 'patient' || lower === 'unknown' || lower === 'unknown patient' || lower === 'n/a') return unknown;
  return name;
}
