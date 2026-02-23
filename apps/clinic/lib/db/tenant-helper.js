/**
 * Tenant isolation helper utilities
 * Ensures all queries are filtered by tenantId
 */

import mongoose from 'mongoose';

/**
 * Adds tenantId filter to any query
 * Converts string tenantId to ObjectId for proper MongoDB matching
 */
export function withTenant(tenantId, query = {}) {
  const tenantObjectId = typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;
  return {
    ...query,
    tenantId: tenantObjectId,
  };
}

/**
 * Validates that a document belongs to the tenant
 */
export async function validateTenantAccess(model, documentId, tenantId) {
  const tenantObjectId = typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;
  const doc = await model.findOne({
    _id: documentId,
    tenantId: tenantObjectId,
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

