/**
 * Client-side cache for dashboard data: in-memory + localStorage.
 * After first login and load, data is persisted so it shows instantly on tab switch
 * or page refresh. Auto-refresh keeps data fresh; updates are written back to
 * localStorage so the next view is instant. Cleared on logout.
 * Keys are scoped by tenantId (clinic) or userId (doctor).
 */

import { DASHBOARD_CACHE_TTL_MS } from '@/lib/constants/dashboard';

const PREFIX = 'dashboard_cache:';
const store = new Map();

function key(scope, id) {
  const k = id ?? 'default';
  return `${scope}:${k}`;
}

function storageKey(scope, id) {
  return PREFIX + key(scope, id);
}

function isBrowser() {
  return typeof window !== 'undefined' && window.localStorage != null;
}

/**
 * Read from localStorage. Returns parsed { data, updatedAt } or null.
 */
function readFromStorage(scope, id) {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(storageKey(scope, id));
    if (raw == null) return null;
    const entry = JSON.parse(raw);
    return entry && typeof entry === 'object' ? entry : null;
  } catch {
    return null;
  }
}

/**
 * Write to localStorage. Swallows quota/private-mode errors.
 */
function writeToStorage(scope, id, entry) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(storageKey(scope, id), JSON.stringify(entry));
  } catch {
    // QuotaExceeded or localStorage disabled (private mode)
  }
}

/**
 * Remove one key from localStorage.
 */
function removeFromStorage(scope, id) {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(storageKey(scope, id));
  } catch {
    // ignore
  }
}

/**
 * Get cached value. Reads memory first, then localStorage (e.g. after refresh).
 * Returns { data, updatedAt } or null.
 */
export function get(scope, id) {
  const mem = store.get(key(scope, id));
  if (mem) return mem;
  const fromStorage = readFromStorage(scope, id);
  if (fromStorage) {
    store.set(key(scope, id), fromStorage);
    return fromStorage;
  }
  return null;
}

/**
 * Set cached value. Writes to memory and localStorage so it persists and shows
 * instantly on next tab/refresh. Call after every successful fetch so updates
 * are reflected immediately.
 */
export function set(scope, id, data) {
  const entry = { data, updatedAt: Date.now() };
  store.set(key(scope, id), entry);
  writeToStorage(scope, id, entry);
}

/**
 * True if cache entry is missing or older than DASHBOARD_CACHE_TTL_MS.
 */
export function isStale(scope, id) {
  const entry = get(scope, id);
  if (!entry) return true;
  return Date.now() - entry.updatedAt > DASHBOARD_CACHE_TTL_MS;
}

/**
 * Get cached data only (or undefined). Used for initial state so dashboard
 * shows instant data from localStorage after first load.
 */
export function getData(scope, id) {
  const entry = get(scope, id);
  return entry?.data;
}

/**
 * Clear cache. Call on logout so the next user does not see previous data.
 * clear() = clear all dashboard cache; clear(scope) = clear scope; clear(scope, id) = clear one.
 */
export function clear(scope, id) {
  if (scope === undefined) {
    store.clear();
    if (isBrowser()) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k != null && k.startsWith(PREFIX)) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    return;
  }
  if (id === undefined) {
    const prefix = scope + ':';
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k);
    }
    if (isBrowser()) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k != null && k.startsWith(PREFIX + scope + ':')) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    return;
  }
  store.delete(key(scope, id));
  removeFromStorage(scope, id);
}
