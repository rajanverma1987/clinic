/**
 * Cache layer – getCache / setCache with TTL.
 * Used by dashboard APIs. Wraps in-memory Map; can be swapped for Redis.
 *
 * TTLs: summary 60s, alerts 30s, trends 300s
 */

const store = new Map();

const DEFAULT_TTL = {
  summary: 60,
  alerts: 30,
  trends: 300,
};

/**
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 */
export async function setCache(key, value, ttlSeconds = 60) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { value, expiresAt });
}

export { DEFAULT_TTL };
