import { useAuth } from '@/contexts/AuthContext';
import { useI18nOptional } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { formatLocale } from '@/lib/i18n';
import { useEffect, useState } from 'react';

const DEFAULT_SETTINGS = {
  settings: {
    currency: 'USD',
    locale: 'en-US',
    timezone: 'UTC',
  },
};

/**
 * Hook to fetch and access tenant settings.
 * Waits for auth to settle before fetching so no request is sent without a token.
 * @returns {object} { settings, loading, error, currency, locale, timezone }
 */
export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const { locale: i18nLocale } = useI18nOptional();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    const token = apiClient.getToken();
    if (!token) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/settings');
        if (response.success && response.data) {
          setSettings(response.data);
          setError(null);
        } else {
          setError(response.error?.message || 'Failed to fetch settings');
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch settings');
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authLoading, user]);

  return {
    settings,
    loading,
    error,
    currency: settings?.settings?.currency || 'USD',
    locale: formatLocale(i18nLocale) || settings?.settings?.locale || 'en-US',
    timezone: settings?.settings?.timezone || 'UTC',
  };
}
