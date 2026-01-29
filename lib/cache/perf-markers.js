/**
 * Performance markers for cache hits/misses (useQueryStats reads these).
 */

const cacheHitRef = { current: 0 };
const cacheMissRef = { current: 0 };

export function recordCacheHit() {
  cacheHitRef.current += 1;
}

export function recordCacheMiss() {
  cacheMissRef.current += 1;
}

export function getCacheHitMiss() {
  return { hits: cacheHitRef.current, misses: cacheMissRef.current };
}
