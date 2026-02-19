'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment
 * so styles apply reliably on client-side navigation (no hard refresh needed).
 * Includes offline banner and error boundary for enterprise resilience.
 * Primes SWR cache for /api/dashboard/all so when the dashboard page mounts and
 * calls useDashboard(), data is already in cache → zero loading state on navigation.
 */
import { DASHBOARD_ALL_KEY } from '@/app/dashboard/hooks/useDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect } from 'react';
import { mutate } from 'swr';
import './styles/dashboard.css';

const dashboardFetcher = async () => {
  const res = await apiClient.get('/dashboard/all');
  if (!res?.success) return undefined;
  return res.data;
};

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.tenantId) return;
    mutate(DASHBOARD_ALL_KEY, dashboardFetcher, {
      revalidate: false,
      populateCache: true,
    });
  }, [user?.tenantId]);

  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
