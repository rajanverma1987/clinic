'use client';

import { apiClient } from '@/lib/api/client.js';
import { extractLocale, formatLocale, getTranslation, supportedLocales } from '@/lib/i18n/index.js';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const I18nContext = createContext(undefined);

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState('en');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load locale from tenant settings or localStorage
  useEffect(() => {
    if (!mounted) return;

    const loadLocale = async () => {
      try {
        // Try to get locale from localStorage first (for faster initial render)
        const storedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

        if (storedLocale && supportedLocales.includes(storedLocale)) {
          setLocaleState(storedLocale);
          setLoading(false);
        }

        // If user is logged in, fetch tenant settings
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
          } catch (error) {
            console.error('Failed to load tenant settings:', error);
          }
        } else {
          // For non-authenticated users, use browser locale
          if (typeof window !== 'undefined' && !storedLocale) {
            const browserLocale = extractLocale(navigator.language);
            if (supportedLocales.includes(browserLocale)) {
              setLocaleState(browserLocale);
              localStorage.setItem('locale', browserLocale);
            }
          }
        }
      } catch (error) {
        console.error('Error loading locale:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocale();
  }, [user, mounted]);

  const setLocale = (newLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }

    // Optionally update tenant settings if user is logged in
    if (user) {
      // This is async and we don't need to wait for it
      apiClient
        .put('/settings', {
          settings: {
            locale: formatLocale(newLocale),
          },
        })
        .catch((error) => {
          console.error('Failed to update tenant locale:', error);
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
          String(paramValue)
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
