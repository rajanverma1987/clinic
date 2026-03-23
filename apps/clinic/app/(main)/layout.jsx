'use client';

import { Layout } from '@/components/layout/Layout';
import { LayoutOptionsProvider } from '@/contexts/LayoutOptionsContext';

/**
 * Shared app-shell layout for all sidebar routes. Keeps Sidebar (and logo) mounted
 * across navigations so the logo image is not re-requested on every menu click.
 * isRootShell tells Layout to render the full shell (sidebar + main); pages under (main)
 * can still use <Layout title="..."> and Layout will just render children (no double shell).
 */
export default function MainLayout({ children }) {
  return (
    <LayoutOptionsProvider>
      <Layout isRootShell>{children}</Layout>
    </LayoutOptionsProvider>
  );
}
