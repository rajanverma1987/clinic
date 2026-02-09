/**
 * Department Head Doctor API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { assignHeadDoctor, removeHeadDoctor } from '@/services/department.service';
import { z } from 'zod';

const assignHeadDoctorSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
});

/**
 * PUT /api/departments/[id]/head-doctor
 * Assign head doctor to department
 */
async function putHandler(req, user, { params }) {
  const departmentId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = assignHeadDoctorSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const department = await assignHeadDoctor(
    departmentId,
    validationResult.data.doctorId,
    user.tenantId,
    user.userId
  );

  if (!department) {
    return NextResponse.json(
      errorResponse('Department not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(department));
}

/**
 * DELETE /api/departments/[id]/head-doctor
 * Remove head doctor from department
 */
async function deleteHandler(req, user, { params }) {
  const departmentId = params.id;

  const department = await removeHeadDoctor(departmentId, user.tenantId, user.userId);

  if (!department) {
    return NextResponse.json(
      errorResponse('Department not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(department));
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
