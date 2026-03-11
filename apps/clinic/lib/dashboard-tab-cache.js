/**
 * Dashboard tab data – direct API fetch for tab content.
 * Cache removed; re-implement when needed.
 */

import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';

const LIMIT = 10;
const REVALIDATE_DELAY_MS = 800; // Delay before revalidate when tab opens

/** No-op; kept for API compatibility. */
export function getCachedAppointments() {
  return null;
}

/** No-op; kept for API compatibility. */
export function getCachedPrescriptions() {
  return null;
}

/** No-op; kept for API compatibility. */
export function updateAppointmentsCache() {}

/** No-op; kept for API compatibility. */
export function updatePrescriptionsCache() {}

/** No-op; prefetch removed. */
export async function prefetchAppointmentsTab() {}

/** No-op; prefetch removed. */
export async function prefetchPrescriptionsTab() {}

/**
 * Fetch appointments for dashboard tab. Returns { data, error }.
 * @param {string} userId
 * @param {string} [locale] - e.g. 'es', 'ar' for localized patient names
 */
export async function fetchAppointmentsTab(userId, locale = '') {
  if (!userId) return { data: [], error: null };
  try {
    const params = new URLSearchParams({ page: '1', limit: String(LIMIT) });
    const localeCode = (locale || 'en').slice(0, 2);
    params.append('locale', localeCode);
    const response = await apiClient.get(`/appointments?${params}`);
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const filtered = (list || []).filter(
        (apt) => apt && !apt.isTelemedicine && apt.status !== 'arrived',
      );
      return { data: filtered, error: null };
    }
    return { data: [], error: null };
  } catch (err) {
    logger.error('Dashboard tab fetch appointments failed', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch prescriptions for dashboard tab.
 * @param {string} userId
 * @param {string} [locale] - e.g. 'es', 'ar' for localized patient/doctor names
 */
export async function fetchPrescriptionsTab(userId, locale = '') {
  if (!userId) return { data: [], error: null };
  try {
    const params = new URLSearchParams({ limit: String(LIMIT) });
    const localeCode = (locale || 'en').slice(0, 2);
    params.set('locale', localeCode);
    const response = await apiClient.get(`/prescriptions?${params}`);
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const data = Array.isArray(list) ? list.slice(0, LIMIT) : [];
      return { data, error: null };
    }
    return { data: [], error: null };
  } catch (err) {
    logger.error('Dashboard tab fetch prescriptions failed', err);
    return { data: null, error: err };
  }
}

export { REVALIDATE_DELAY_MS };
