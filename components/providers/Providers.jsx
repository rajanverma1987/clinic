'use client';

import { PageTransition } from '@/components/layout/PageTransition';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureProvider } from '@/contexts/FeatureContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <I18nProvider>
        <FeatureProvider>
          <NotificationProvider>
            <PageTransition>{children}</PageTransition>
          </NotificationProvider>
        </FeatureProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
