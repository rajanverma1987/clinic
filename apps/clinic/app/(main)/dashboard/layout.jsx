'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment.
 * Data fetching is tab-scoped: dashboard page fetches only for the active tab (overview/kpi → dashboard APIs; appointments → appointments API; prescriptions → prescriptions API).
 */
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import './styles/dashboard.css';

export default function DashboardLayout({ children }) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
