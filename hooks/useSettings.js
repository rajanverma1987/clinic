import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

/**
 * Hook to fetch and access tenant settings
 * @returns {object} { settings, loading, error, currency, locale, timezone }
 */
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/settings');
        if (response.success && response.data) {
          setSettings(response.data);
          setError(null);
        } else {
          setError(response.error?.message || 'Failed to fetch settings');
          // Set defaults if fetch fails
          setSettings({
            settings: {
              currency: 'USD',
              locale: 'en-US',
              timezone: 'UTC',
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError(err.message || 'Failed to fetch settings');
        // Set defaults on error
        setSettings({
          settings: {
            currency: 'USD',
            locale: 'en-US',
            timezone: 'UTC',
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    currency: settings?.settings?.currency || 'USD',
    locale: settings?.settings?.locale || 'en-US',
    timezone: settings?.settings?.timezone || 'UTC',
  };
}

