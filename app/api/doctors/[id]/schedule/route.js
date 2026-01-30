/**
 * Doctor Schedule API Routes
 * GET: return schedule in frontend format (day-keyed, breaks, slotDuration, advanceBooking, etc.)
 * PUT: update schedule from frontend payload
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateScheduleSchema } from '@/lib/validations/doctor';
import { getDoctorSchedule, updateDoctorSchedule } from '@/services/doctor.service';

/**
 * GET /api/doctors/[id]/schedule
 * Get doctor schedule (frontend format)
 */
async function getHandler(req, user, { params }) {
  const resolved = await params;
  const doctorId = resolved.id;
  const data = await getDoctorSchedule(doctorId, user.tenantId);
  return NextResponse.json(successResponse(data));
}

/**
 * PUT /api/doctors/[id]/schedule
 * Update doctor schedule
 */
async function putHandler(req, user, { params }) {
  const resolved = await params;
  const doctorId = resolved.id;
  const body = await req.json();

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
