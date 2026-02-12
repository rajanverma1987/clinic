'use client';

import { apiClient } from '@/lib/api/client.js';
import { extractLocale, formatLocale, getTranslation, supportedLocales } from '@/lib/i18n/index.js';
import { logger } from '@/lib/utils/logger.js';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const I18nContext = createContext(undefined);

export function I18nProvider({ children }) {
  const router = useRouter();
  const { user } = useAuth();
  const [locale, setLocaleState] = useState('en');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load locale: prefer localStorage (user's explicit choice), then tenant, then browser
  useEffect(() => {
    if (!mounted) return;

    const loadLocale = async () => {
      try {
        const storedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

        // User's explicit choice in localStorage always wins
        if (storedLocale && supportedLocales.includes(storedLocale)) {
          setLocaleState(storedLocale);
          setLoading(false);
          return;
        }

        // If user is logged in and no stored preference, use tenant settings
        if (user) {
          try {
            const response = await apiClient.get('/settings');
            if (response.success && response.data?.settings?.locale) {
              const tenantLocale = extractLocale(response.data.settings.locale);
              if (supportedLocales.includes(tenantLocale)) {
                setLocaleState(tenantLocale);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('locale', tenantLocale);
                }
              }
            }
          } catch (_error) {
            // Tenant settings load failed; use stored locale
          }
        } else {
          // For non-authenticated users, use browser locale when no stored preference
          if (typeof window !== 'undefined') {
            const browserLocale = extractLocale(navigator.language);
            if (supportedLocales.includes(browserLocale)) {
              setLocaleState(browserLocale);
              localStorage.setItem('locale', browserLocale);
            }
          }
        }
      } catch (_error) {
        // Locale load failed; keep default
      } finally {
        setLoading(false);
      }
    };

    loadLocale();
  }, [user, mounted]);

  const setLocale = (newLocale) => {
    const normalized = extractLocale(newLocale);
    setLocaleState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', normalized);
    }
    router.refresh();

    // Optionally update tenant settings if user is logged in
    if (user) {
      // This is async and we don't need to wait for it
      apiClient
        .put('/settings', {
          settings: {
            locale: formatLocale(normalized),
          },
        })
        .catch((error) => {
          logger.error('Failed to update tenant locale', error);
        });
    }
  };

  const t = (key, params) => {
    let translation = getTranslation(key, locale);

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'),
          String(paramValue),
        );
      });
    }

    return translation;
  };

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

/** Safe when rendered outside I18nProvider (e.g. portal or edge load). Returns t that falls back to key. */
export function useI18nOptional() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    return { t: (key) => key, locale: 'en', setLocale: () => {}, loading: false };
  }
  return context;
}
