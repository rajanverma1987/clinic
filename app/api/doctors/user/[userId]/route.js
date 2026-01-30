/**
 * Get Doctor by User ID API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getDoctorByUserId } from '@/services/doctor.service';

/**
 * GET /api/doctors/user/[userId]
 * Get doctor profile by user ID
 */
async function getHandler(req, user, { params }) {
  const userId = params.userId;

  if (!userId || userId === 'undefined' || (typeof userId === 'string' && userId.trim() === '')) {
    return NextResponse.json(
      errorResponse('Invalid or missing user ID', 'BAD_REQUEST'),
      { status: 400 }
    );
  }

  const doctor = await getDoctorByUserId(userId, user.tenantId);

  if (!doctor) {
    return NextResponse.json(
      errorResponse('Doctor profile not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(doctor));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);
