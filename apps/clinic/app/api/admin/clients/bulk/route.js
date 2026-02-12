/**
 * POST /api/admin/clients/bulk
 * Bulk actions: activate, suspend, delete (deactivate) — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Tenant from '@/models/Tenant';
import { NextResponse } from 'next/server';

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const tenantIds = Array.isArray(body.tenantIds) ? body.tenantIds : [];

  if (!['activate', 'suspend', 'deactivate'].includes(action) || tenantIds.length === 0) {
    return NextResponse.json(
      errorResponse('Invalid request. Provide action (activate|suspend|deactivate) and tenantIds array', 'VALIDATION_ERROR'),
      { status: 400 },
    );
  }

  const suspendReason =
    action === 'suspend' && typeof body.suspendReason === 'string'
      ? body.suspendReason.trim()
      : undefined;

  const updates = {
    activate: { $set: { isActive: true, suspended: false }, $unset: { suspendReason: 1 } },
    suspend: {
      $set: {
        suspended: true,
        suspendReason: suspendReason || 'Suspended by administrator',
      },
    },
    deactivate: { $set: { isActive: false } },
  };

  const update = updates[action];
  const result = await Tenant.updateMany({ _id: { $in: tenantIds } }, update);

  return NextResponse.json(
    successResponse({
      message: `${action} applied to ${result.modifiedCount} clinic(s)`,
      modifiedCount: result.modifiedCount,
    }),
  );
}

export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.UPDATE)(postHandler))),
  ),
);
