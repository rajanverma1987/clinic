'use client';

export function AlertsSection({ children, className = '' }) {
  return <section className={`dashboard-section ${className}`}>{children}</section>;
}
