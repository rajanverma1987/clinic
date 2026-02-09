/**
 * Breadcrumb resolution from pathname using dashboard-structure route definitions.
 * Used by PageHeader to show breadcrumbs when not explicitly passed.
 */

import { ALL_PAGES, PAGE_EXTRA_DETAILS } from '@/lib/constants/dashboard-structure.js';

/** Route keys that have dynamic segments, sorted by path length descending for best match */
const ROUTE_KEYS = Object.keys(PAGE_EXTRA_DETAILS)
  .filter(Boolean)
  .sort((a, b) => b.length - a.length);

/** Path segment count for a route key (e.g. /patients/[id] -> 2) */
function segmentCount(path) {
  return path.split('/').filter(Boolean).length;
}

/**
 * Match pathname to a route key (e.g. /patients/507f1f77 -> /patients/[id]).
 * @param {string} pathname - Current pathname (no query)
 * @returns {string|null} Route key or null
 */
export function pathnameToRouteKey(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const clean = pathname.split('?')[0].replace(/\/$/, '') || '/';
  if (PAGE_EXTRA_DETAILS[clean]) return clean;
  for (const key of ROUTE_KEYS) {
    if (!key.includes('[')) continue;
    const pattern = key
      .split('/')
      .map((seg) =>
        seg === '[id]' || seg === '[slug]' ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      )
      .join('/');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(clean)) return key;
  }
  return null;
}

/** labelKey for a path from ALL_PAGES */
function getLabelKeyForPath(path) {
  const page = ALL_PAGES.find((p) => p.path === path);
  return page?.labelKey || null;
}

/**
 * Build breadcrumb chain from route key (root to current).
 * @param {string} routeKey - e.g. /patients/[id]
 * @returns {{ path: string, labelKey: string | null, segmentCount: number }[]}
 */
export function getBreadcrumbChain(routeKey) {
  if (!routeKey || !PAGE_EXTRA_DETAILS[routeKey]) return [];
  const chain = [];
  let current = routeKey;
  while (current) {
    const labelKey = getLabelKeyForPath(current);
    chain.push({ path: current, labelKey, segmentCount: segmentCount(current) });
    const detail = PAGE_EXTRA_DETAILS[current];
    current = detail?.parentPath || null;
  }
  return chain.reverse();
}

/**
 * Build breadcrumb items for pathname: { label, href }[] (last item has no href).
 * @param {string} pathname - e.g. /patients/507f1f77
 * @param {(key: string) => string} t - i18n translate
 * @param {string} [currentPageLabel] - Override label for last segment (e.g. patient name)
 * @returns {{ label: string; href?: string }[]}
 */
export function getBreadcrumbItems(pathname, t, currentPageLabel) {
  const routeKey = pathnameToRouteKey(pathname);
  if (!routeKey) return [];
  const chain = getBreadcrumbChain(routeKey);
  if (chain.length === 0) return [];
  const pathSegments = pathname.split('?')[0].replace(/\/$/, '').split('/').filter(Boolean);
  return chain.map((item, index) => {
    const isLast = index === chain.length - 1;
    const label =
      isLast && currentPageLabel ? currentPageLabel : item.labelKey ? t(item.labelKey) : item.path;
    const href = isLast ? undefined : '/' + pathSegments.slice(0, item.segmentCount).join('/');
    return { label, href };
  });
}
