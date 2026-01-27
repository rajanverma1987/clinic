/**
 * Doctor Schedule API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateScheduleSchema } from '@/lib/validations/doctor';
import { updateDoctorSchedule } from '@/services/doctor.service';

/**
 * PUT /api/doctors/[id]/schedule
 * Update doctor schedule
 */
async function putHandler(req, user, { params }) {
  const doctorId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = updateScheduleSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const doctor = await updateDoctorSchedule(
    doctorId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!doctor) {
    return NextResponse.json(
      errorResponse('Doctor not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(doctor));
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);
