'use client';

/**
 * Dashboard tab: overview content (stats, lists, charts). Renders children passed from the page
 * so the page keeps a single source of data/hooks and passes the overview body here.
 * Enables lazy-loading this tab in a later step.
 */
export function OverviewTab({ children }) {
  return <>{children}</>;
}
