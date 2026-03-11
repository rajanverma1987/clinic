/**
 * Performance markers for API request timing (used by api client).
 */

export function endApiRequestTiming(markName, _endpoint) {
  if (typeof performance === 'undefined' || !performance.measure || !markName) return;
  try {
    performance.measure(`api:${markName}`, markName);
    performance.clearMarks(markName);
    performance.clearMeasures(`api:${markName}`);
  } catch (_) {}
}
