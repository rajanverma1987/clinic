/**
 * Admin Doctors Bulk Action API
 * POST /api/admin/doctors/bulk-action
 * Body: { doctorIds: string[], action: 'suspend' | 'activate' | 'export' | 'notify' }
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Doctor from '@/models/Doctor';
import { NextResponse } from 'next/server';

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
    const { doctorIds, action } = body || {};
    if (!Array.isArray(doctorIds) || !doctorIds.length || !action) {
      return NextResponse.json(
        errorResponse('doctorIds (array) and action are required', 'VALIDATION_ERROR'),
        { status: 400 },
      );
    }

    await connectDB();

    if (action === 'suspend') {
      await Doctor.updateMany(
        { _id: { $in: doctorIds } },
        { $set: { verificationStatus: 'suspended', status: 'inactive', updatedAt: new Date() } },
      );
      return NextResponse.json(successResponse({ updated: doctorIds.length, action: 'suspend' }));
    }
    if (action === 'activate') {
      await Doctor.updateMany(
        { _id: { $in: doctorIds } },
        { $set: { verificationStatus: 'verified', status: 'active', updatedAt: new Date() } },
      );
      return NextResponse.json(successResponse({ updated: doctorIds.length, action: 'activate' }));
    }
    if (action === 'export' || action === 'notify') {
      return NextResponse.json(
        successResponse({ message: 'Action recorded', action, count: doctorIds.length }),
      );
    }

    return NextResponse.json(
      errorResponse(
        'Supported bulk actions: suspend, activate, export, notify',
        'VALIDATION_ERROR',
      ),
      { status: 400 },
    );
}

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates DOCTOR:UPDATE permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.DOCTOR, ACTIONS.UPDATE)(postHandler))),
  ),
);
