/**
 * Doctor Detail API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateDoctorSchema } from '@/lib/validations/doctor';
import {
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '@/services/doctor.service';

/**
 * GET /api/doctors/[id]
 * Get doctor by ID
 */
async function getHandler(req, user, { params }) {
  const doctorId = params.id;

  const doctor = await getDoctorById(doctorId, user.tenantId, user.userId);

  if (!doctor) {
    return NextResponse.json(
      errorResponse('Doctor not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(doctor));
}

/**
 * PUT /api/doctors/[id]
 * Update doctor profile
 */
async function putHandler(req, user, { params }) {
  const doctorId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = updateDoctorSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const doctor = await updateDoctor(
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
 * DELETE /api/doctors/[id]
 * Delete doctor profile (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const doctorId = params.id;

  const deleted = await deleteDoctor(doctorId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Doctor not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Doctor deleted successfully' }));
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

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
