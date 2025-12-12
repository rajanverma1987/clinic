import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
// Import additional languages - using English as fallback for now
// In production, add full translation files for each language

export const supportedLocales = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'hi', // Hindi
  'ar', // Arabic
  'zh', // Chinese
  'de', // German
  'pt', // Portuguese
  'ja', // Japanese
  'ru', // Russian
  'it', // Italian
  'nl', // Dutch
  'ko', // Korean
  'tr', // Turkish
  'pl', // Polish
  'th', // Thai
  'vi', // Vietnamese
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
  it: 'Italiano',
  nl: 'Nederlands',
  ko: '한국어',
  tr: 'Türkçe',
  pl: 'Polski',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

export const localeDisplayNames = {
  en: 'English (US)',
  es: 'Español (España)',
  fr: 'Français (Canada)',
};

// Translations - fallback to English for languages without full translations
const translations = {
  en,
  es,
  fr,
  // For now, use English as fallback for other languages
  // In production, add full translation files
  hi: en, // Hindi - fallback to English
  ar: en, // Arabic - fallback to English
  zh: en, // Chinese - fallback to English
  de: en, // German - fallback to English
  pt: en, // Portuguese - fallback to English
  ja: en, // Japanese - fallback to English
  ru: en, // Russian - fallback to English
  it: en, // Italian - fallback to English
  nl: en, // Dutch - fallback to English
  ko: en, // Korean - fallback to English
  tr: en, // Turkish - fallback to English
  pl: en, // Polish - fallback to English
  th: en, // Thai - fallback to English
  vi: en, // Vietnamese - fallback to English
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
    en: 'en-US',   // English - United States
    es: 'es-ES',   // Spanish - Spain
    fr: 'fr-FR',   // French - France
    hi: 'hi-IN',   // Hindi - India
    ar: 'ar-SA',   // Arabic - Saudi Arabia
    zh: 'zh-CN',   // Chinese - China
    de: 'de-DE',   // German - Germany
    pt: 'pt-PT',   // Portuguese - Portugal
    ja: 'ja-JP',   // Japanese - Japan
    ru: 'ru-RU',   // Russian - Russia
    it: 'it-IT',   // Italian - Italy
    nl: 'nl-NL',   // Dutch - Netherlands
    ko: 'ko-KR',   // Korean - Korea
    tr: 'tr-TR',   // Turkish - Turkey
    pl: 'pl-PL',   // Polish - Poland
    th: 'th-TH',   // Thai - Thailand
    vi: 'vi-VN',   // Vietnamese - Vietnam
  };
  return localeMap[locale] || 'en-US';
}

