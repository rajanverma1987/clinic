/**
 * Cache invalidation rules per CursorMD/New realtime-caching-strategy.md.
 * When an event occurs, invalidate related cache keys so clients/API get fresh data.
 */

import { deleteCachePattern } from './redis-client.js';

/**
 * Event -> cache key patterns to invalidate (tenant-scoped: prefix with tenantId when calling)
 */
export const INVALIDATION_RULES = {
  'appointment:created': ['appointments:*', 'dashboard:stats:*', 'patient:appointments:*'],
  'appointment:updated': ['appointments:*', 'appointment:*'],
  'appointment:cancelled': ['appointments:*', 'appointment:*', 'dashboard:stats:*'],
  'patient:registered': ['patients:*', 'dashboard:stats:*'],
  'patient:updated': ['patients:*', 'patient:*'],
  'payment:received': ['invoices:*', 'payments:*', 'dashboard:revenue:*'],
  'invoice:generated': ['invoices:*', 'dashboard:revenue:*'],
  'stock:low': ['inventory:*', 'medicines:*'],
  'stock:updated': ['inventory:*', 'medicines:*'],
  'medicine:expired': ['inventory:*', 'medicines:*'],
};

/**
 * Invalidate cache for a given event and optional tenantId.
 * Patterns are prefixed with tenantId if provided (e.g. "tenantId:appointments:*").
 */
export async function invalidateOnEvent(event, tenantId) {
  const patterns = INVALIDATION_RULES[event];
  if (!patterns || patterns.length === 0) return;

  const prefix = tenantId ? `${tenantId}:` : '';
  for (const pattern of patterns) {
    const fullPattern = prefix ? `${prefix}${pattern}` : pattern;
    await deleteCachePattern(fullPattern);
  }
}
