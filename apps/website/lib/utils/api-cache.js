/**
 * API cache – no-op. Caching disabled; re-implement when needed.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function getCacheTtlForEndpoint() {
  return DEFAULT_TTL_MS;
}

export function getCachedResponse() {
  return null;
}

export function setCachedResponse() {}

export function clearCache() {}

export function clearCacheByPrefix() {}

export function clearAllCache() {}

export function generateCacheKey(url, params = {}) {
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `${url}${url.includes('?') ? '&' : '?'}${sorted}`;
  }
  return url;
}
