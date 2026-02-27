'use client';

import { apiClient } from '@/lib/api/client.js';
import { extractLocale, formatLocale, getTranslation, supportedLocales } from '@/lib/i18n/index.js';
import { logger } from '@/lib/utils/logger.js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const I18nContext = createContext(undefined);

function getLocaleFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const localeParam = params.get('locale') || params.get('lang');
  if (!localeParam) return null;
  const locale = extractLocale(localeParam);
  return supportedLocales.includes(locale) ? locale : null;
}

function applyLocaleToDocument(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale === 'ar' ? 'ar' : locale === 'es' ? 'es' : 'en';
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState('en');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load locale: URL (?locale=es) > localStorage > tenant (if logged in) > browser
  useEffect(() => {
    if (!mounted) return;

    const loadLocale = async () => {
      try {
        // 1) URL param wins for this page load and is persisted
        const urlLocale = getLocaleFromUrl();
        if (urlLocale) {
          setLocaleState(urlLocale);
          localStorage.setItem('locale', urlLocale);
          applyLocaleToDocument(urlLocale);
          setLoading(false);
          return;
        }

        const storedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

        // 2) User's explicit choice in localStorage
        if (storedLocale && supportedLocales.includes(storedLocale)) {
          setLocaleState(storedLocale);
          applyLocaleToDocument(storedLocale);
          setLoading(false);
          return;
        }

        // 3) If user is logged in, use tenant settings
        if (user) {
          try {
            const response = await apiClient.get('/settings');
            if (response.success && response.data?.settings?.locale) {
              const tenantLocale = extractLocale(response.data.settings.locale);
              if (supportedLocales.includes(tenantLocale)) {
                setLocaleState(tenantLocale);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('locale', tenantLocale);
                  applyLocaleToDocument(tenantLocale);
                }
              }
            }
          } catch (_error) {
            // Tenant settings load failed
          }
        } else {
          // 4) Non-authenticated: use browser locale when no stored preference
          if (typeof window !== 'undefined') {
            const browserLocale = extractLocale(navigator.language);
            if (supportedLocales.includes(browserLocale)) {
              setLocaleState(browserLocale);
              localStorage.setItem('locale', browserLocale);
              applyLocaleToDocument(browserLocale);
            } else {
              applyLocaleToDocument('en');
            }
          }
        }
      } catch (_error) {
        applyLocaleToDocument('en');
      } finally {
        setLoading(false);
      }
    };

    loadLocale();
  }, [user, mounted]);

  const setLocale = useCallback(
    (newLocale) => {
      if (!supportedLocales.includes(newLocale)) return;
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
        applyLocaleToDocument(newLocale);
      }

      if (user) {
        apiClient
          .put('/settings', {
            settings: { locale: formatLocale(newLocale) },
          })
          .catch((error) => {
            logger.error('Failed to update tenant locale', error);
          });
      }
    },
    [user]
  );

  const t = useCallback(
    (key, params) => {
      let translation = getTranslation(key, locale);
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(
            new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'),
            String(paramValue)
          );
        });
      }
      return translation;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
