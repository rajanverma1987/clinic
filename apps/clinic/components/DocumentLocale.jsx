'use client';

/**
 * Applies current locale to the document: lang and dir (RTL for Arabic).
 * Must be mounted inside I18nProvider so useI18n() has the active locale.
 * Fixes "AR not applied" – when user selects Arabic, document gets lang="ar" and dir="rtl".
 */
import { useI18n } from '@/contexts/I18nContext';
import { formatLocale } from '@/lib/i18n';
import { useEffect } from 'react';

const RTL_LOCALES = ['ar'];

export function DocumentLocale() {
  const { locale } = useI18n();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const lang = formatLocale(locale);
    root.setAttribute('lang', lang);
    root.setAttribute('dir', RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr');
  }, [locale]);

  return null;
}
