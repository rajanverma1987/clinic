/**
 * Dashboard tab cache – enterprise stale-while-revalidate.
 * Tabs show preloaded/cached data immediately, then revalidate after REVALIDATE_DELAY_MS.
 * Prefetch on tab hover warms cache for instant display on click.
 */

import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';

const CACHE = new Map();
const LIMIT = 10;
const CACHE_TTL_MS = 60000; // 1 min – consider cached data "fresh" within this window
const REVALIDATE_DELAY_MS = 800; // 0.8 sec – delay before revalidate when tab opens (cache shown first)

function cacheKey(type, userId) {
  return `${type}-tab-${userId}`;
}

export function getCachedAppointments(userId) {
  const key = cacheKey('appointments', userId);
  const entry = CACHE.get(key);
  if (!entry) return null;
  return entry.data;
}

export function getCachedPrescriptions(userId) {
  const key = cacheKey('prescriptions', userId);
  const entry = CACHE.get(key);
  if (!entry) return null;
  return entry.data;
}

function setCache(type, userId, data) {
  const key = cacheKey(type, userId);
  CACHE.set(key, { data, timestamp: Date.now() });
}

/** Update cache from tab state (e.g. after mutation). Keeps preload in sync. */
export function updateAppointmentsCache(userId, data) {
  if (userId && Array.isArray(data)) setCache('appointments', userId, data);
}

export function updatePrescriptionsCache(userId, data) {
  if (userId && Array.isArray(data)) setCache('prescriptions', userId, data);
}

/**
 * Prefetch appointments – runs in background, populates cache.
 * Call on tab hover so data is ready when user clicks.
 */
export async function prefetchAppointmentsTab(userId) {
  if (!userId) return;
  try {
    const params = new URLSearchParams({ page: '1', limit: String(LIMIT) });
    const response = await apiClient.get(`/appointments?${params}`);
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const filtered = (list || []).filter(
        (apt) => apt && !apt.isTelemedicine && apt.status !== 'arrived',
      );
      setCache('appointments', userId, filtered);
    } else {
      setCache('appointments', userId, []);
    }
  } catch (err) {
    logger.error('Dashboard tab prefetch appointments failed', err);
  }
}

/**
 * Prefetch prescriptions – runs in background, populates cache.
 */
export async function prefetchPrescriptionsTab(userId) {
  if (!userId) return;
  try {
    const response = await apiClient.get('/prescriptions');
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const data = Array.isArray(list) ? list.slice(0, LIMIT) : [];
      setCache('prescriptions', userId, data);
    } else {
      setCache('prescriptions', userId, []);
    }
  } catch (err) {
    logger.error('Dashboard tab prefetch prescriptions failed', err);
  }
}

/**
 * Fetch appointments (full flow). Returns { data, error }.
 * Used by tab to revalidate. Does not set loading – tab handles that.
 */
export async function fetchAppointmentsTab(userId) {
  if (!userId) return { data: [], error: null };
  try {
    const params = new URLSearchParams({ page: '1', limit: String(LIMIT) });
    const response = await apiClient.get(`/appointments?${params}`);
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const filtered = (list || []).filter(
        (apt) => apt && !apt.isTelemedicine && apt.status !== 'arrived',
      );
      setCache('appointments', userId, filtered);
      return { data: filtered, error: null };
    }
    setCache('appointments', userId, []);
    return { data: [], error: null };
  } catch (err) {
    logger.error('Dashboard tab fetch appointments failed', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch prescriptions (full flow).
 */
export async function fetchPrescriptionsTab(userId) {
  if (!userId) return { data: [], error: null };
  try {
    const response = await apiClient.get('/prescriptions');
    if (response.success && response.data) {
      const list = extractArrayData(response);
      const data = Array.isArray(list) ? list.slice(0, LIMIT) : [];
      setCache('prescriptions', userId, data);
      return { data, error: null };
    }
    setCache('prescriptions', userId, []);
    return { data: [], error: null };
  } catch (err) {
    logger.error('Dashboard tab fetch prescriptions failed', err);
    return { data: null, error: err };
  }
}

export { CACHE_TTL_MS, REVALIDATE_DELAY_MS };
