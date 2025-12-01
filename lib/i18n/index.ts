import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

export type Locale = 'en' | 'es' | 'fr';
export type TranslationKey = string;

export const supportedLocales: Locale[] = ['en', 'es', 'fr'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const localeDisplayNames: Record<Locale, string> = {
  en: 'English (US)',
  es: 'Español (España)',
  fr: 'Français (Canada)',
};

const translations: Record<Locale, any> = {
  en,
  es,
  fr,
};

/**
 * Get translation for a given key and locale
 * Supports nested keys like "auth.login"
 */
export function getTranslation(key: TranslationKey, locale: Locale = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations['en'];

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
export function extractLocale(localeString: string): Locale {
  const locale = localeString.split('-')[0].toLowerCase();
  if (supportedLocales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return 'en'; // Default to English
}

/**
 * Format locale string to standard format (e.g., "en" -> "en-US")
 */
export function formatLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-CA',
  };
  return localeMap[locale] || 'en-US';
}

