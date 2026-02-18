/**
 * IndexedDB cache utilities (stub for website app)
 * Website app doesn't need IndexedDB caching
 */

export function clearIndexedDBCache() {
  // No-op for website app
}

export function clearOfflineMutations() {
  // No-op for website app
}

// Stub implementations for APIs used by offline queue in the full app.
// Website doesn't persist offline mutations, so these are harmless no-ops.
export async function addOfflineMutation() {
  return false;
}

export async function getOfflineMutations() {
  return [];
}

export async function removeOfflineMutation() {
  return false;
}
