/**
 * Queue mutations when offline; sync when back online.
 * Log failed operations to retry later (IndexedDB).
 */

import { addOfflineMutation, getOfflineMutations, removeOfflineMutation } from '@/lib/cache/indexed-db-cache';

function getApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL || '';
  const isLocalhost = /localhost|127\.0\.0\.1/.test(configured);
  if (typeof window !== 'undefined' && isLocalhost) {
    const onDeployedSite = !/localhost|127\.0\.0\.1/.test(window.location?.hostname || '');
    if (onDeployedSite) return '/api';
  }
  return configured && configured.trim() ? configured.replace(/\/$/, '') : '/api';
}

const BASE = getApiBase();

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Queue a mutation for later replay. Call when request fails due to offline.
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {string} url - path (e.g. /appointments)
 * @param {object} [body] - request body
 */
export async function queueMutation(method, url, body) {
  const fullUrl = url.startsWith('http') ? url : `${BASE.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`;
  await addOfflineMutation({
    method,
    url: fullUrl,
    body: body || null,
    token: getToken(),
  });
}

/**
 * Replay all queued mutations. Call when back online. Uses current token when replaying.
 * @param {function} [fetchFn] - (url, options) => fetch(...). Default uses global fetch with current token.
 * @returns {{ replayed: number, failed: number }}
 */
export async function replayOfflineQueue(fetchFn) {
  const list = await getOfflineMutations();
  let replayed = 0;
  let failed = 0;
  const token = getToken();
  const doFetch = fetchFn || fetch;
  for (const item of list) {
    try {
      const res = await doFetch(item.url, {
        method: item.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (res.ok) {
        await removeOfflineMutation(item.id);
        replayed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { replayed, failed };
}
