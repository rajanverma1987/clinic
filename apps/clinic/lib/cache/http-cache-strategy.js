/**
 * HTTP cache strategy – single source of truth for Cache-Control and related headers.
 * Used by next.config.js headers(). Aligns with how large companies handle caching:
 *
 * 1. Document (HTML): never serve stale after deploy → revalidate every time.
 * 2. Static assets (hashed): immutable, long cache → 1 year (CDN/browser).
 * 3. API: handled by client (api-cache.js TTL + invalidation) and optionally SW; no long-lived HTTP cache.
 *
 * @see next.config.js headers()
 * @see public/sw.js (navigation = network-first; _next/static = network-first)
 */

/** Document and app routes: always revalidate so normal refresh gets latest deploy. */
const DOCUMENT_CACHE_CONTROL = 'no-cache, must-revalidate';

/** Pragma for HTTP/1.0 caches and older proxies (backward compatibility). */
const PRAGMA = 'no-cache';

/** Hashed static assets (/_next/static, /images): immutable, 1 year. Next.js uses content hashes in filenames. */
const STATIC_IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** One-year max-age in seconds (31536000). */
const STATIC_MAX_AGE_SECONDS = 31536000;

module.exports = {
  DOCUMENT_CACHE_CONTROL,
  PRAGMA,
  STATIC_IMMUTABLE_CACHE_CONTROL,
  STATIC_MAX_AGE_SECONDS,
};
