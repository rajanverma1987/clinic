/**
 * Tenant isolation helper utilities
 * Ensures all queries are filtered by tenantId
 */

/**
 * Adds tenantId filter to any query
 */
export function withTenant(tenantId, query = {}) {
  return {
    ...query,
    tenantId,
  };
}

/**
 * Validates that a document belongs to the tenant
 */
export async function validateTenantAccess(model, documentId, tenantId) {
  const doc = await model.findOne({
    _id: documentId,
    tenantId,
  });

  return doc;
}

/**
 * Throws error if tenantId doesn't match
 */
export function assertTenantMatch(documentTenantId, userTenantId) {
  if (!documentTenantId || documentTenantId !== userTenantId) {
    throw new Error('Access denied: Tenant mismatch');
  }
}

