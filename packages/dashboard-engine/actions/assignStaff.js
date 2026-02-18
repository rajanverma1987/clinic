import { validateAdapter } from '../context.js';

/**
 * Assign staff to role/clinic. Delegates to adapter (app implements actual DB/API).
 * Engine does not touch DB.
 *
 * @param {string} tenantId
 * @param {AssignStaffPayload} payload - e.g. { userId, role, clinicId }
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function assignStaff(tenantId, payload, adapter) {
  validateAdapter(adapter);
  if (!tenantId || !payload) return { success: false, error: 'tenantId and payload are required' };
  return adapter.assignStaff(tenantId, payload);
}
