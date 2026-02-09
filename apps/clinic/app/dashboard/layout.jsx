'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment
 * so styles apply reliably on client-side navigation (no hard refresh needed).
 * Includes offline banner and error boundary for enterprise resilience.
 * Runs critical data preload in parallel when layout mounts so dashboard SWR gets
 * warmer server cache or deduped requests.
 */
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { preloadCriticalData } from '@/lib/preload/DashboardPreloader';
import { useEffect } from 'react';
import './styles/dashboard.css';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.tenantId || !user?.userId) return;
    preloadCriticalData(user.tenantId, user.userId, user.role ?? '', {
      fetchFn: (endpoint) => apiClient.get(endpoint),
    });
  }, [user?.tenantId, user?.userId, user?.role]);

  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
}
