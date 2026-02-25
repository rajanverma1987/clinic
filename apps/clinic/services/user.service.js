/**
 * User service stub for dashboard-engine adapter.
 * assignStaff() uses updateUserRole when available; this stub allows the build to resolve the module.
 */

/**
 * Update user role (stub – assign staff not implemented in clinic app).
 * @param {{ tenantId: string, [key: string]: unknown }} _opts
 */
export async function updateUserRole(_opts) {
  throw new Error('Assign staff not implemented');
}
