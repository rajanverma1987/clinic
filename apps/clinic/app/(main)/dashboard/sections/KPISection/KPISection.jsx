'use client';

/**
 * KPISection – KPI stats grid. Data from /api/dashboard/summary or stats.
 */
export function KPISection({ children, className = '' }) {
  return <section className={`dashboard-section ${className}`}>{children}</section>;
}
