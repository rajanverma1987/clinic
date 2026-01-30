import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
// Supported: English, Spanish, Arabic (100% key parity via scripts/sync-locales.js)
export const supportedLocales = [
  'en', // English (default)
  'es', // Spanish
  'ar', // Arabic
];

export const localeNames = {
  en: 'English',
  es: 'Español',
  ar: 'العربية',
};

export const localeDisplayNames = {
  en: 'English (US)',
  es: 'Español',
  ar: 'العربية',
};

const translations = {
  en,
  es,
  ar,
};

/**
 * Get translation for a given key and locale
 * Supports nested keys like "auth.login"
 */
export function getTranslation(key, locale = 'en') {
  const keys = key.split('.');
  let value = translations[locale] || translations['en'];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations['en'];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Extract locale from locale string (e.g., "en-US" -> "en")
 */
export function extractLocale(localeString) {
  const locale = localeString.split('-')[0].toLowerCase();
  if (supportedLocales.includes(locale)) {
    return locale;
  }
  return 'en'; // Default to English
}

/**
 * Format locale string to standard format (e.g., "en" -> "en-US")
 * Maps all supported languages to their standard locale format
 */
export function formatLocale(locale) {
  const localeMap = {
    en: 'en-US',
    es: 'es-ES',
    ar: 'ar-SA',
  };
  return localeMap[locale] || 'en-US';
}
