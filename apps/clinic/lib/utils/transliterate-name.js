/**
 * Latin-to-Arabic transliteration for patient display names when locale=ar and no stored Arabic name.
 * Pure in-memory mapping; no external API or PHI leaves the server.
 * Used so the appointments list patient column can show names in Arabic script.
 */

/** Single-character Latin → Arabic (for names, common romanization) */
const LATIN_TO_ARABIC = {
  a: '\u0627', // ا (alef or fatha context; standalone we use alef)
  b: '\u0628', // ب
  c: '\u0643', // ك
  d: '\u062F', // د
  e: '\u064A', // ي (or ى in final; use ya for simplicity)
  f: '\u0641', // ف
  g: '\u062C', // ج
  h: '\u0647', // ه
  i: '\u064A', // ي
  j: '\u062C', // ج
  k: '\u0643', // ك
  l: '\u0644', // ل
  m: '\u0645', // م
  n: '\u0646', // ن
  o: '\u0648', // و
  p: '\u0628', // ب (no p in Arabic)
  q: '\u0642', // ق
  r: '\u0631', // ر
  s: '\u0633', // س
  t: '\u062A', // ت
  u: '\u0648', // و
  v: '\u0641', // ف
  w: '\u0648', // و
  x: '\u0643\u0633', // كس
  y: '\u064A', // ي
  z: '\u0632', // ز
};

/**
 * Transliterate a Latin-script name (e.g. "Priya Sharma") to Arabic script for display.
 * Only maps a-z; digits and spaces are preserved. Non-ASCII is left as-is.
 *
 * @param {string} text - Latin text (e.g. first or last name)
 * @returns {string} Arabic-script equivalent for display
 */
export function transliterateToArabic(text) {
  if (text == null || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  let result = '';
  const lower = trimmed.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    if (ch >= 'a' && ch <= 'z') {
      result += LATIN_TO_ARABIC[ch] || ch;
    } else if (ch === ' ' || (ch >= '0' && ch <= '9')) {
      result += ch;
    } else {
      result += ch;
    }
  }
  return result.trim();
}
