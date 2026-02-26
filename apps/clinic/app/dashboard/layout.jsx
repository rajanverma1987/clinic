'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment
 * so styles apply reliably on client-side navigation (no hard refresh needed).
 * Primes SWR cache for summary + all so when the dashboard page mounts, data is
 * often already in cache → lightning-fast first paint (summary) or zero loading (all).
 */
import { DASHBOARD_ALL_KEY, DASHBOARD_SUMMARY_KEY } from '@/app/dashboard/hooks/useDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useEffect } from 'react';
import { mutate } from 'swr';
import './styles/dashboard.css';

const summaryFetcher = async () => {
  const res = await apiClient.get('/dashboard/summary');
  if (!res?.success) return undefined;
  return res.data;
};

const allFetcher = async () => {
  const res = await apiClient.get('/dashboard/all');
  if (!res?.success) return undefined;
  return res.data;
};

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    mutate(DASHBOARD_SUMMARY_KEY, summaryFetcher, {
      revalidate: false,
      populateCache: true,
    });
    mutate(DASHBOARD_ALL_KEY, allFetcher, {
      revalidate: false,
      populateCache: true,
    });
  }, [user]);

  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
