'use client';

/**
 * Dashboard route layout – ensures dashboard.css is loaded with the route segment
 * so styles apply reliably on client-side navigation (no hard refresh needed).
 * Without this, page-only CSS can load after paint or fail to load on soft nav.
 */
import './styles/dashboard.css';

export default function DashboardLayout({ children }) {
  return children;
}
