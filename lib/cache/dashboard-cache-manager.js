/**
 * Multi-layer dashboard cache manager: memory, IndexedDB, localStorage.
 * Used by useDashboardCache and websocket-sync for invalidation.
 * Server-safe: no-op when window/indexedDB undefined.
 */

import { logger } from '@/lib/utils/logger.js';
import { CACHE_LAYERS } from './cache-architecture.js';
import { DASHBOARD_CACHE_CONFIG } from './dashboard-cache-config.js';

const IDB_NAME = 'DashboardCache';
const IDB_VERSION = 1;
const WIDGET_STORE = 'widgets';
const MAX_MEMORY_ENTRIES = 1000;
const MAX_MEMORY_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

class DashboardCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.entryCache = new Map(); // key -> { data, timestamp } for stale checks
    this.indexedDB = null;
    this.idbPromise = null;
    this.listeners = new Map();
    if (isBrowser()) {
      this.idbPromise = this.initIndexedDB();
    }
  }

  async initIndexedDB() {
    if (!isBrowser()) return null;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve(this.indexedDB);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(WIDGET_STORE)) {
          db.createObjectStore(WIDGET_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  ensureIDB() {
    if (this.indexedDB) return Promise.resolve(this.indexedDB);
    return this.idbPromise || Promise.resolve(null);
  }

  generateKey(widget, params = {}) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config || !config.cacheKey) return `${widget}:default`;
    if (
      config.cacheKey.includes('tenantId') &&
      (params.tenantId == null || params.tenantId === '')
    ) {
      logger.warn('Dashboard cache key missing required tenantId', { widget });
      return null;
    }
    const keyParts = config.cacheKey.map((k) => params[k] ?? 'default');
    return `${widget}:${keyParts.join(':')}`;
  }

  getMemoryCacheSize() {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      try {
        size += JSON.stringify(entry?.data).length;
      } catch {
        size += 1024;
      }
    }
    return size;
  }

  evictLRUMemory() {
    if (this.memoryCache.size === 0) return;
    const oldestKey = this.memoryCache.keys().next().value;
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.entryCache.delete(oldestKey);
    }
  }

  getStoreForWidget(widget) {
    return WIDGET_STORE;
  }

  isExpired(cacheEntry, ttlSeconds) {
    if (!cacheEntry || typeof cacheEntry.timestamp !== 'number') return true;
    const age = (Date.now() - cacheEntry.timestamp) / 1000;
    return age > ttlSeconds;
  }

  isStale(widget, cacheEntry) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config || !config.staleTime || !cacheEntry?.timestamp) return false;
    const age = (Date.now() - cacheEntry.timestamp) / 1000;
    return age > config.staleTime;
  }

  setMemory(key, data, ttlSeconds) {
    while (
      this.memoryCache.size >= MAX_MEMORY_ENTRIES ||
      this.getMemoryCacheSize() >= MAX_MEMORY_SIZE_BYTES
    ) {
      if (this.memoryCache.size === 0) break;
      this.evictLRUMemory();
    }
    const entry = { data, timestamp: Date.now(), ttl: ttlSeconds * 1000 };
    this.memoryCache.set(key, entry);
    this.entryCache.set(key, { data: entry.data, timestamp: entry.timestamp });
  }

  getMemory(key) {
    return this.memoryCache.get(key) || null;
  }

  async getFromIndexedDB(key) {
    const db = await this.ensureIDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(WIDGET_STORE, 'readonly');
        const store = tx.objectStore(WIDGET_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async setIndexedDB(key, entry) {
    const db = await this.ensureIDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(WIDGET_STORE, 'readwrite');
        const store = tx.objectStore(WIDGET_STORE);
        const request = store.put({ key, ...entry });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  getFromLocalStorage(key) {
    if (!isBrowser() || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setLocalStorage(key, entry) {
    if (!isBrowser() || !window.localStorage) return;
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      if (e?.name === 'QuotaExceededError') this.clearOldLocalStorage();
    }
  }

  /**
   * Get cached data only. Returns null on miss or expiry. Refuses to return when tenantId required but missing.
   */
  async get(widget, params = {}) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config) return null;
    const key = this.generateKey(widget, params);
    if (key == null) return null;
    const ttl = config.ttl || {};

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.MEMORY.storage)) {
      const mem = this.getMemory(key);
      if (mem && !this.isExpired(mem, ttl.memory || 60)) {
        return mem.data;
      }
    }

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.INDEXED_DB.storage)) {
      const idb = await this.getFromIndexedDB(key);
      const idbEntry =
        idb && typeof idb === 'object' ? { data: idb.data, timestamp: idb.timestamp } : null;
      if (idbEntry && !this.isExpired(idbEntry, ttl.indexedDB || 300)) {
        if (ttl.memory) this.setMemory(key, idbEntry.data, ttl.memory);
        return idbEntry.data;
      }
    }

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.LOCAL_STORAGE.storage)) {
      const ls = this.getFromLocalStorage(key);
      const ttlLs = ttl.localStorage || 86400;
      if (ls && !this.isExpired(ls, ttlLs)) {
        return ls.data;
      }
    }

    return null;
  }

  /**
   * Get cache entry { data, timestamp } for stale detection. Returns null when tenantId required but missing.
   */
  async getEntry(widget, params = {}) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config) return null;
    const key = this.generateKey(widget, params);
    if (key == null) return null;
    const ttl = config.ttl || {};

    const fromMem = this.entryCache.get(key) || this.getMemory(key);
    if (fromMem && fromMem.timestamp) {
      const age = (Date.now() - fromMem.timestamp) / 1000;
      const ttlSec = ttl.memory || 60;
      if (age <= ttlSec) return { data: fromMem.data ?? fromMem, timestamp: fromMem.timestamp };
    }

    const idb = await this.getFromIndexedDB(key);
    if (idb && idb.timestamp != null) {
      const age = (Date.now() - idb.timestamp) / 1000;
      if (age <= (ttl.indexedDB || 300)) {
        return { data: idb.data, timestamp: idb.timestamp };
      }
    }

    const ls = this.getFromLocalStorage(key);
    if (ls && ls.timestamp != null) {
      const age = (Date.now() - ls.timestamp) / 1000;
      if (age <= (ttl.localStorage || 86400)) {
        return { data: ls.data, timestamp: ls.timestamp };
      }
    }

    return null;
  }

  async set(widget, params = {}, data) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config) return;
    const key = this.generateKey(widget, params);
    if (key == null) return;
    const timestamp = Date.now();
    const entry = { data, timestamp, version: this.getDataVersion(widget) };

    const ttl = config.ttl || {};

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.MEMORY.storage)) {
      this.setMemory(key, data, ttl.memory || 60);
    }

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.INDEXED_DB.storage)) {
      try {
        await this.setIndexedDB(key, entry);
      } catch (e) {
        logger.warn('Dashboard cache IndexedDB set failed', { key, error: e?.message });
      }
    }

    if (config.layer.some((l) => l.storage === CACHE_LAYERS.LOCAL_STORAGE.storage)) {
      this.setLocalStorage(key, entry);
    }
  }

  invalidate(widget, params = {}) {
    const key = this.generateKey(widget, params);
    if (key == null) return;
    this.memoryCache.delete(key);
    this.entryCache.delete(key);
    if (isBrowser() && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    this.deleteFromIndexedDB(key).catch(() => {});
  }

  async deleteFromIndexedDB(key) {
    const db = await this.ensureIDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(WIDGET_STORE, 'readwrite');
        const store = tx.objectStore(WIDGET_STORE);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  invalidateAll(widget) {
    const prefix = widget + ':';
    for (const k of Array.from(this.memoryCache.keys())) {
      if (k.startsWith(prefix)) {
        this.memoryCache.delete(k);
        this.entryCache.delete(k);
      }
    }
    if (isBrowser() && window.localStorage) {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }
  }

  subscribe(widget, callback) {
    const config = DASHBOARD_CACHE_CONFIG[widget];
    if (!config?.revalidateOn) return;
    const events = Array.isArray(config.revalidateOn) ? config.revalidateOn : [config.revalidateOn];
    events.forEach((event) => {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event).add({ widget, callback });
    });
  }

  unsubscribe(widget) {
    this.listeners.forEach((set) => {
      for (const item of set) {
        if (item.widget === widget) set.delete(item);
      }
    });
  }

  emit(event, params = {}) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach(({ widget, callback }) => {
      this.invalidate(widget, params);
      if (typeof callback === 'function') callback(widget, params);
    });
  }

  getDataVersion(widget) {
    return this.memoryCache.get(`${widget}:version`)?.data ?? 1;
  }

  clearOldLocalStorage() {
    if (!isBrowser() || !window.localStorage) return;
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key.indexOf(':') === -1) continue;
      try {
        const raw = localStorage.getItem(key);
        const data = raw ? JSON.parse(raw) : null;
        if (data && typeof data.timestamp === 'number') {
          entries.push({ key, timestamp: data.timestamp });
        }
      } catch {}
    }
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.max(1, Math.floor(entries.length * 0.25));
    entries.slice(0, toRemove).forEach(({ key }) => localStorage.removeItem(key));
  }

  getStats() {
    return {
      memory: { size: this.memoryCache.size, keys: Array.from(this.memoryCache.keys()) },
      listeners: { events: Array.from(this.listeners.keys()), count: this.listeners.size },
    };
  }
}

export const dashboardCacheManager = new DashboardCacheManager();
