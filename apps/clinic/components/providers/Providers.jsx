'use client';

import { CacheWarming } from '@/components/CacheWarming';
import { DocumentLocale } from '@/components/DocumentLocale';
import { OfflineReplay } from '@/components/OfflineReplay';
import { PageTransition } from '@/components/layout/PageTransition';
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper';
import { AppNotificationsProvider } from '@/contexts/AppNotificationsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfirmationProvider } from '@/contexts/ConfirmationContext';
import { FeatureProvider } from '@/contexts/FeatureContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SWRConfig } from 'swr';

function swrRetryWithBackoff(err, _key, _config, revalidate, { retryCount }) {
  if (err?.status === 401 || err?.status === 403) return;
  const maxRetries = 3;
  if (retryCount >= maxRetries) return;
  const delay = Math.min(1000 * 2 ** retryCount, 30000);
  setTimeout(() => revalidate({ retryCount }), delay);
}

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: (err) => err?.status !== 401 && err?.status !== 403,
  onErrorRetry: swrRetryWithBackoff,
};

export function Providers({ children }) {
  return (
    <AuthProvider>
      <SWRConfig value={swrOptions}>
        <I18nProvider>
          <DocumentLocale />
          <ThemeProvider>
            <RealtimeProvider>
              <OfflineReplay />
              <CacheWarming />
              <FeatureProvider>
                <NotificationProvider>
                  <AppNotificationsProvider>
                    <NotificationWrapper>
                      <ConfirmationProvider>
                        <PageTransition>{children}</PageTransition>
                      </ConfirmationProvider>
                    </NotificationWrapper>
                  </AppNotificationsProvider>
                </NotificationProvider>
              </FeatureProvider>
            </RealtimeProvider>
          </ThemeProvider>
        </I18nProvider>
      </SWRConfig>
    </AuthProvider>
  );
}
