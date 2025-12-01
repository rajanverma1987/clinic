'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, getTranslation, extractLocale, supportedLocales } from '@/lib/i18n';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/api/client';

interface TenantSettings {
  locale: string;
  currency: string;
  timezone: string;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>('en');
  const [loading, setLoading] = useState(true);

  // Load locale from tenant settings or localStorage
  useEffect(() => {
    const loadLocale = async () => {
      try {
        // Try to get locale from localStorage first (for faster initial render)
        const storedLocale = typeof window !== 'undefined' 
          ? localStorage.getItem('locale') 
          : null;
        
        if (storedLocale && supportedLocales.includes(storedLocale as Locale)) {
          setLocaleState(storedLocale as Locale);
          setLoading(false);
        }

        // If user is logged in, fetch tenant settings
        if (user) {
          try {
            const response = await apiClient.get<{ settings: TenantSettings }>('/settings');
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
  }, [user]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    
    // Optionally update tenant settings if user is logged in
    if (user) {
      // This is async and we don't need to wait for it
      apiClient.put('/settings', {
        settings: {
          locale: newLocale === 'en' ? 'en-US' : 
                  newLocale === 'es' ? 'es-ES' : 
                  'fr-CA',
        },
      }).catch(error => {
        console.error('Failed to update tenant locale:', error);
      });
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
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

