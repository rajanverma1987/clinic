/**
 * Doctor API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createDoctorSchema, doctorQuerySchema } from '@/lib/validations/doctor';
import { createDoctor, listDoctors } from '@/services/doctor.service';

/**
 * GET /api/doctors
 * List doctors with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    status: searchParams.get('status') || undefined,
    departmentId: searchParams.get('departmentId') || undefined,
    specialization: searchParams.get('specialization') || undefined,
  };

  const validationResult = doctorQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listDoctors(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/doctors
 * Create a new doctor profile
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createDoctorSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const doctor = await createDoctor(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: doctor._id.toString(),
      userId: doctor.userId.toString(),
      status: doctor.status,
      createdAt: doctor.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DOCTOR, ACTIONS.CREATE)(postHandler)
    )
  )
);
