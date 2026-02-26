/**
 * Locations (branches) API – list for current tenant.
 * Used by reports and other modules that filter by branchId.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger';
import Location from '@/models/Location';

/**
 * GET /api/locations
 * List active locations (branches) for the current tenant.
 */
async function getHandler(req, user) {
  if (!user.tenantId) {
    return NextResponse.json(
      errorResponse('Tenant context required', 'MISSING_TENANT'),
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const filter = withTenant(user.tenantId, {
      isActive: true,
      deletedAt: null,
    });

    const locations = await Location.find(filter)
      .select('_id name code')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(successResponse(locations));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('GET /api/locations failed', { error: message });
    return NextResponse.json(
      errorResponse(message || 'Failed to load locations', 'SERVER_ERROR'),
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler)
    )
  )
);
