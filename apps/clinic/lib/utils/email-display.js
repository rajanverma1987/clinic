/**
 * Email display value for locale (same approach as item names in clinic).
 * Translates/transliterates both the local part (before @) and the domain (e.g. gmail.com, doctor.com).
 */

import { transliterateToArabic } from '@/lib/utils/transliterate-name';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish';

function getDisplayValue(str, code) {
  if (str == null || String(str).trim() === '') return '';
  const s = String(str).trim();
  if (code === 'ar') return transliterateToArabic(s) || s;
  if (code === 'es') return s.split(/\s+/).map((w) => translateToSpanish(w) || w).join(' ').trim() || s;
  return s;
}

/** Translate domain e.g. "gmail.com" or "doctor.com" for display (each label transliterated/translated) */
function getDomainDisplayValue(domain, code) {
  if (domain == null || String(domain).trim() === '') return '';
  const s = String(domain).trim();
  if (!s.startsWith('@')) return getDisplayValue(s, code);
  const afterAt = s.slice(1);
  const parts = afterAt.split('.');
  const translated = parts.map((p) => getDisplayValue(p, code));
  return '@' + translated.join('.');
}

/**
 * @param {string} email - Full email address
 * @param {string} localeCode - 'en' | 'ar' | 'es'
 * @returns {string} Email with local part and domain translated for display (e.g. @gmail.com → @جيميل.كوم in ar)
 */
export function getEmailDisplayValue(email, localeCode) {
  if (email == null || String(email).trim() === '') return '';
  const s = String(email).trim();
  const at = s.indexOf('@');
  if (at <= 0) return getDisplayValue(s, localeCode);
  const localPart = s.slice(0, at);
  const domain = s.slice(at);
  return getDisplayValue(localPart, localeCode) + getDomainDisplayValue(domain, localeCode);
}
