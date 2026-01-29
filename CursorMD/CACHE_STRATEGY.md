# Cache Strategy – Best Practice for the Project

**Date:** January 2026  
**Status:** Single source for client and server caching

## Overview

- **Client (browser):** In-memory cache for GET responses via `lib/utils/api-cache.js`. TTL is per-endpoint; invalidation by key or prefix.
- **Server (API):** Redis-backed cache via `lib/cache/cache-manager.js` for read-heavy endpoints (e.g. dashboard stats). Redis is optional; cache read/write failures are handled so the app works without Redis.

## Client-Side Cache (`lib/utils/api-cache.js`)

### TTL by endpoint

| Endpoint prefix      | TTL   | Rationale                          |
|----------------------|-------|------------------------------------|
| `/reports/`          | 2 min | Dashboard, revenue, charts – stable |
| `/doctors/`          | 2 min | Doctor dashboard                    |
| `/appointments`       | 1 min | Lists change often                  |
| `/patients`           | 1 min |                                    |
| `/invoices`          | 1 min |                                    |
| `/inventory`         | 1 min |                                    |
| `/prescriptions`     | 1 min |                                    |
| `/queue`             | 1 min |                                    |
| Other                | 5 min | Default                             |

### API

- **getCachedResponse(key)** – Returns cached data or `null` if miss/expired.
- **setCachedResponse(key, data, duration?)** – Stores response; `duration` in ms. If omitted, uses `getCacheTtlForEndpoint` when called from apiClient (see below).
- **getCacheTtlForEndpoint(endpoint)** – Returns TTL in ms from `TTL_BY_PREFIX`.
- **clearCache(key)** – Removes one entry.
- **clearCacheByPrefix(prefix)** – Removes all keys starting with `prefix` (e.g. `/reports` to clear all report caches).
- **clearAllCache()** – Clears entire cache (e.g. on logout).
- **generateCacheKey(url, params)** – Stable key from URL + sorted params.

### Usage in apiClient (`lib/api/client.js`)

- **GET:** Before fetch, `getCachedResponse(cacheKey)`; on success, `setCachedResponse(cacheKey, data, getCacheTtlForEndpoint(endpoint))`.
- **Invalidation:** `apiClient.clearCacheForEndpoint(endpointOrPrefix)` – clears exact key and all keys with that path prefix. Call after mutations (e.g. after creating a patient, call `clearCacheForEndpoint('/patients')` if you want list caches refreshed).

## Server-Side Cache (Redis + CacheManager)

### When to use

- Read-heavy, tenant-scoped GET endpoints (e.g. dashboard stats, aggregated reports).
- Prefer short TTLs (60–120s) so data stays fresh; use Redis for shared cache across instances.

### CacheManager (`lib/cache/cache-manager.js`)

- **get(prefix, ...keyParts)** – e.g. `CacheManager.get('reports', 'dashboard', tenantId)`.
- **set(prefix, data, ttlSeconds, ...keyParts)** – e.g. `CacheManager.set('reports', stats, 120, 'dashboard', tenantId)`.
- **invalidate(prefix, ...keyParts)** – Delete one key.
- **invalidatePattern(pattern)** – Delete by Redis pattern (use sparingly).

Keys are built as `prefix:keyPart1:keyPart2:...`. Always include `tenantId` in keyParts for tenant isolation.

### Implemented

- **GET /api/reports/dashboard** – Cache key `reports:dashboard:{tenantId}`, TTL 120s. On miss, fetches from DB and sets cache. If Redis is down, get returns null and set fails silently; response is still returned from DB.

### Graceful degradation

- Redis is optional. If `REDIS_URL` is unset or Redis is unavailable, `lib/cache/redis-client.js` returns null on get and false on set; no throw. Routes should treat cache as best-effort and always be able to serve from DB.

## Invalidation

- **Client:** After POST/PUT/DELETE, call `apiClient.clearCacheForEndpoint('/resource')` (or more specific prefix) so subsequent GETs for that resource see fresh data. Optional: call after mutations from dashboard (e.g. after adding patient, clear `/patients` and optionally `/reports`).
- **Server:** Invalidate when data changes (e.g. after bulk update affecting dashboard). Use `CacheManager.invalidate('reports', 'dashboard', tenantId)` or `invalidatePattern('reports:dashboard:*')` if needed. Not yet wired in every mutation; add when required.

## Rules

1. **Tenant isolation:** Server cache keys always include `tenantId`.
2. **Short TTLs for lists:** 1 min for appointments, patients, invoices, inventory, prescriptions, queue.
3. **Slightly longer for reports:** 2 min for dashboard and report endpoints.
4. **No PHI in keys:** Use IDs and path/query only; never patient names or PHI in cache keys.
5. **Fail safely:** Cache read/write errors must not break requests; always fall back to DB/fetch.

## Files

- Client: `lib/utils/api-cache.js`, `lib/api/client.js`
- Server: `lib/cache/cache-manager.js`, `lib/cache/redis-client.js`
- Example server cache: `app/api/reports/dashboard/route.js`
