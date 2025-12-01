/**
 * Tenant isolation helper utilities
 * Ensures all queries are filtered by tenantId
 */

import { FilterQuery, Model } from 'mongoose';

/**
 * Adds tenantId filter to any query
 */
export function withTenant<T>(
  tenantId: string,
  query: FilterQuery<T> = {}
): FilterQuery<T> {
  return {
    ...query,
    tenantId,
  };
}

/**
 * Validates that a document belongs to the tenant
 */
export async function validateTenantAccess<T extends { tenantId: string }>(
  model: Model<T>,
  documentId: string,
  tenantId: string
): Promise<T | null> {
  const doc = await model.findOne({
    _id: documentId,
    tenantId,
  } as FilterQuery<T>);

  return doc;
}

/**
 * Throws error if tenantId doesn't match
 */
export function assertTenantMatch(
  documentTenantId: string | undefined,
  userTenantId: string
): void {
  if (!documentTenantId || documentTenantId !== userTenantId) {
    throw new Error('Access denied: Tenant mismatch');
  }
}

