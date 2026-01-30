/**
 * Doctor Leave Management API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { addLeaveSchema } from '@/lib/validations/doctor';
import { addDoctorLeave, removeDoctorLeave } from '@/services/doctor.service';

/**
 * POST /api/doctors/[id]/leaves
 * Add leave to doctor schedule
 */
async function postHandler(req, user, { params }) {
  const doctorId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = addLeaveSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const doctor = await addDoctorLeave(
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

/**
 * DELETE /api/doctors/[id]/leaves?index=0
 * Remove leave from doctor schedule
 */
async function deleteHandler(req, user, { params }) {
  const doctorId = params.id;
  const { searchParams } = new URL(req.url);
  const leaveIndex = parseInt(searchParams.get('index') || '0', 10);

  if (isNaN(leaveIndex) || leaveIndex < 0) {
    return NextResponse.json(
      errorResponse('Invalid leave index', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const doctor = await removeDoctorLeave(
    doctorId,
    leaveIndex,
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
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
