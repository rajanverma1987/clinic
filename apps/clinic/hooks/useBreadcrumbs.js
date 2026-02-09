'use client';

import { useI18n } from '@/contexts/I18nContext';
import { getBreadcrumbItems } from '@/lib/breadcrumbs';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Returns breadcrumb items for the current route (for use in PageHeader).
 * When currentPageLabel is provided (e.g. page title), it is used as the last segment label.
 * @param {{ currentPageLabel?: string }} [options]
 * @returns {{ label: string; href?: string }[]}
 */
export function useBreadcrumbs(options = {}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { currentPageLabel } = options;
  return useMemo(
    () => getBreadcrumbItems(pathname || '', t, currentPageLabel),
    [pathname, t, currentPageLabel],
  );
}
