/**
 * IndexedDB cache for offline-first: store last 7 days of dashboard/list data.
 * Cache versioning to handle schema changes.
 */

const DB_NAME = 'clinic_dashboard_db';
const DB_VERSION = 3;
const STORE_NAME = 'dashboard_cache';
const OFFLINE_QUEUE_STORE = 'offline_mutations';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let dbPromise = null;

function openDB() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('scope', 'scope', { unique: false });
      }
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        const q = db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        q.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
  return dbPromise;
}

/**
 * @param {string} scope - e.g. 'stats', 'lists', 'charts'
 * @param {string} id - tenantId or userId
 * @returns {string}
 */
function cacheKey(scope, id) {
  return `${scope}:${id || 'default'}`;
}

/**
 * Get cached data from IndexedDB. Returns null if missing or older than 7 days.
 * @param {string} scope
 * @param {string} id
 * @returns {Promise<{ data: any, updatedAt: number } | null>}
 */
export async function getIndexedDBCache(scope, id) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    const key = cacheKey(scope, id);
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      const entry = req.result;
      if (!entry || typeof entry.updatedAt !== 'number') {
        resolve(null);
        return;
      }
      if (Date.now() - entry.updatedAt > MAX_AGE_MS) {
        resolve(null);
        return;
      }
      resolve({ data: entry.data, updatedAt: entry.updatedAt });
    };
    req.onerror = () => resolve(null);
  });
}

/**
 * Set cache in IndexedDB. Overwrites by key.
 * @param {string} scope
 * @param {string} id
 * @param {any} data
 */
export async function setIndexedDBCache(scope, id, data) {
  const db = await openDB();
  if (!db) return;
  const key = cacheKey(scope, id);
  const entry = { key, scope, id, data, updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all entries for a scope (or everything if scope is undefined).
 * @param {string} [scope]
 */
export async function clearIndexedDBCache(scope) {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    if (!scope) {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      return;
    }
    const idx = store.index('scope');
    const req = idx.openCursor(IDBKeyRange.only(scope));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** Offline mutation queue: add a failed/pending mutation to retry later */
export async function addOfflineMutation(mutation) {
  const db = await openDB();
  if (!db) return;
  const entry = {
    ...mutation,
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const req = store.add(entry);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Get all queued mutations (oldest first) */
export async function getOfflineMutations() {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const idx = store.index('createdAt');
    const req = idx.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a mutation from the queue by id */
export async function removeOfflineMutation(id) {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Clear all queued mutations */
export async function clearOfflineMutations() {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
