/**
 * Client-side cache for dashboard data: in-memory + localStorage.
 * Bounded by MAX_DASHBOARD_CACHE_ENTRIES_PER_SCOPE (memory) and MAX_DASHBOARD_STORAGE_KEYS (localStorage);
 * evicts oldest entries when over limit (enterprise-style).
 * After first login and load, data is persisted so it shows instantly on tab switch
 * or page refresh. Cleared on logout.
 */

import { DASHBOARD_CACHE_TTL_MS } from '@/lib/constants/dashboard';
import {
  MAX_DASHBOARD_CACHE_ENTRIES_PER_SCOPE,
  MAX_DASHBOARD_STORAGE_KEYS,
} from '@/lib/constants/cache-limits';

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
 * Evict oldest entry in scope when over limit (by updatedAt).
 */
function evictOldestInScope(scope) {
  const prefix = `${scope}:`;
  const entries = [];
  for (const [storeKey, entry] of store) {
    if (storeKey.startsWith(prefix)) {
      const id = storeKey.slice(prefix.length);
      entries.push({ storeKey, id, updatedAt: entry.updatedAt });
    }
  }
  if (entries.length < MAX_DASHBOARD_CACHE_ENTRIES_PER_SCOPE) return;
  entries.sort((a, b) => a.updatedAt - b.updatedAt);
  const toRemove = entries.slice(0, entries.length - MAX_DASHBOARD_CACHE_ENTRIES_PER_SCOPE + 1);
  toRemove.forEach(({ storeKey, id }) => {
    store.delete(storeKey);
    removeFromStorage(scope, id);
  });
}

/**
 * Ensure localStorage has at most MAX_DASHBOARD_STORAGE_KEYS keys; evict oldest by key (by updatedAt).
 */
function evictOldestStorageKeys() {
  if (!isBrowser()) return;
  try {
    const keysWithAge = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k == null || !k.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(k);
      let updatedAt = 0;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          updatedAt = parsed?.updatedAt ?? 0;
        } catch (_) {}
      }
      keysWithAge.push({ key: k, updatedAt });
    }
    if (keysWithAge.length <= MAX_DASHBOARD_STORAGE_KEYS) return;
    keysWithAge.sort((a, b) => a.updatedAt - b.updatedAt);
    const toRemove = keysWithAge.slice(0, keysWithAge.length - MAX_DASHBOARD_STORAGE_KEYS);
    toRemove.forEach(({ key: k }) => localStorage.removeItem(k));
  } catch (_) {}
}

/**
 * Set cached value. Writes to memory and localStorage so it persists and shows
 * instantly on next tab/refresh. Evicts oldest in scope / storage when over limit.
 */
export function set(scope, id, data) {
  const entry = { data, updatedAt: Date.now() };
  const fullKey = key(scope, id);
  store.set(fullKey, entry);
  evictOldestInScope(scope);
  writeToStorage(scope, id, entry);
  evictOldestStorageKeys();
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
