/**
 * API cache – no-op. No caching; re-implement when needed.
 */

export function getCacheTtlForEndpoint() {
  return 5 * 60 * 1000;
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
