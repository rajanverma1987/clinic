import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
// Import additional languages - using English as fallback for now
// In production, add full translation files for each language

// Best countries/regions where language change is commonly needed
export const supportedLocales = [
  'en', // English (default)
  'es', // Spanish – Spain, Latin America
  'fr', // French – France, Quebec, Francophone Africa
  'hi', // Hindi – India
  'ar', // Arabic – Middle East, North Africa
  'zh', // Chinese – China
  'de', // German – Germany, DACH
  'pt', // Portuguese – Brazil, Portugal
  'ja', // Japanese – Japan
  'ru', // Russian – Russia, CIS
];

export const localeNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  ar: 'العربية',
  zh: '中文',
  de: 'Deutsch',
  pt: 'Português',
  ja: '日本語',
  ru: 'Русский',
};

export const localeDisplayNames = {
  en: 'English (US)',
  es: 'Español (España)',
  fr: 'Français (France)',
};

// Translations - fallback to English for languages without full translations
const translations = {
  en,
  es,
  fr,
  hi: en,
  ar: en,
  zh: en,
  de: en,
  pt: en,
  ja: en,
  ru: en,
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
    fr: 'fr-FR',
    hi: 'hi-IN',
    ar: 'ar-SA',
    zh: 'zh-CN',
    de: 'de-DE',
    pt: 'pt-PT',
    ja: 'ja-JP',
    ru: 'ru-RU',
  };
  return localeMap[locale] || 'en-US';
}

