/**
 * Client-side cache – no-op. get/getData return null; set/clear do nothing.
 * Re-implement when caching is needed.
 */

export function get() {
  return null;
}

export function getData() {
  return undefined;
}

export function set() {}

export function clear() {}

export function isStale() {
  return true;
}
