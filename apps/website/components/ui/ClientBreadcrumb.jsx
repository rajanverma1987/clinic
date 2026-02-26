'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useI18n } from '@/contexts/I18nContext';

/**
 * Breadcrumb with i18n labels. Use from server components (e.g. Terms, Privacy) so metadata can stay server-side.
 * @param {{ items: Array<{ href?: string; labelKey: string }> }} props - items with labelKey (i18n key); href optional for current page
 */
export function ClientBreadcrumb({ items = [] }) {
  const { t } = useI18n();
  const resolved = items.map((item) => ({
    label: t(item.labelKey),
    ...(item.href != null ? { href: item.href } : {}),
  }));
  return <Breadcrumb items={resolved} />;
}
