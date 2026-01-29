/**
 * Service Worker
 * Provides offline support and caching
 * Based on NEW-PLANS.md requirements
 */

const CACHE_NAME = 'clinic-app-v2';
const STATIC_CACHE = 'clinic-static-v2';
const API_CACHE = 'clinic-api-v1';

// Install event – no longer pre-cache HTML; documents use network-first so new design loads without hard refresh
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - cache with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Next.js build assets (_next/static) – network-first so CSS/JS always update after deploy
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Navigation/document requests (page loads) – always network-first, never cache.
  // Prevents “old design until hard refresh” after deploys.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/') || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // Other static assets (images, fonts, etc.) – cache-first for offline; documents handled above
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

// Background sync for offline actions (Level 3: Service Worker for background sync)
const DB_NAME = 'clinic_dashboard_db';
const DB_VERSION = 3;
const OFFLINE_QUEUE_STORE = 'offline_mutations';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-api-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function getOfflineMutations(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const idx = store.index('createdAt');
    const req = idx.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function removeOfflineMutation(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_QUEUE_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function syncOfflineRequests() {
  let db;
  try {
    db = await openDB();
  } catch (e) {
    return;
  }
  const list = await getOfflineMutations(db);
  for (const item of list) {
    try {
      const res = await fetch(item.url, {
        method: item.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(item.token ? { Authorization: 'Bearer ' + item.token } : {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (res.ok) {
        await removeOfflineMutation(db, item.id);
      }
    } catch (_) {}
  }
}
