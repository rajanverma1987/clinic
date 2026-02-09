/**
 * Get Doctor by User ID API Route
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getDoctorByUserId, getOrCreateDoctorByUserId } from '@/services/doctor.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/doctors/user/[userId]
 * Get doctor profile by user ID
 */
async function getHandler(req, user, { params }) {
  const userId = params.userId;

  const invalid =
    userId == null ||
    userId === 'undefined' ||
    userId === 'null' ||
    (typeof userId === 'string' && userId.trim() === '');
  if (invalid) {
    return NextResponse.json(errorResponse('Invalid or missing user ID', 'BAD_REQUEST'), {
      status: 400,
    });
  }

  const isOwnProfile = String(user._id ?? user.id ?? user.userId ?? '') === String(userId);

  const doctor = isOwnProfile
    ? await getOrCreateDoctorByUserId(userId, user.tenantId)
    : await getDoctorByUserId(userId, user.tenantId);

  if (!doctor) {
    return NextResponse.json(errorResponse('Doctor profile not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse(doctor));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(
        RESOURCES.DOCTOR,
        ACTIONS.READ,
      )(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      }),
    ),
  ),
);
