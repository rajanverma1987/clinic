'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment
 * so styles apply reliably on client-side navigation (no hard refresh needed).
 * Includes offline banner and error boundary for enterprise resilience.
 */
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import './styles/dashboard.css';

export default function DashboardLayout({ children }) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
}
