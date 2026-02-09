/**
 * Current tenant id for use in fetchers (no React context available).
 * Set by app on login; used by IndexedDB-backed SWR fetchers.
 */
let currentTenantId = null;

export function setCurrentTenantId(tenantId) {
  currentTenantId = tenantId;
}

export function getCurrentTenantId() {
  return currentTenantId;
}
