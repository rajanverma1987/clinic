/**
 * Performance markers for cache hits/misses (useQueryStats reads these).
 * API request timing: log when response exceeds P95 target (200ms).
 */

const cacheHitRef = { current: 0 };
const cacheMissRef = { current: 0 };

/** Target: API response < 200ms P95 (PROBLEMS.md). Log when exceeded. */
export const API_P95_TARGET_MS = 200;

export function recordCacheHit() {
  cacheHitRef.current += 1;
}

export function recordCacheMiss() {
  cacheMissRef.current += 1;
}

export function getCacheHitMiss() {
  return { hits: cacheHitRef.current, misses: cacheMissRef.current };
}

/**
 * Measure API request duration and log if over P95 target. Call at end of request.
 * @param {string} markName - Name passed to performance.mark(markName) at request start
 * @param {string} endpoint - API endpoint (for logging)
 */
export function endApiRequestTiming(markName, endpoint) {
  try {
    const measureName = `api-measure-${markName}`;
    performance.measure(measureName, markName);
    const entry = performance.getEntriesByName(measureName)[0];
    if (entry && entry.duration > API_P95_TARGET_MS) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[API] Request exceeded P95 target', {
          endpoint,
          durationMs: Math.round(entry.duration),
          targetMs: API_P95_TARGET_MS,
        });
      }
    }
    performance.clearMarks(markName);
    performance.clearMeasures(measureName);
  } catch (_) {}
}
