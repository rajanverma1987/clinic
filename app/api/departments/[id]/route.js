/**
 * Department Detail API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateDepartmentSchema } from '@/lib/validations/department';
import {
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '@/services/department.service';

/**
 * GET /api/departments/[id]
 * Get department by ID
 */
async function getHandler(req, user, { params }) {
  const departmentId = params.id;

  const department = await getDepartmentById(departmentId, user.tenantId, user.userId);

  if (!department) {
    return NextResponse.json(
      errorResponse('Department not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(department));
}

/**
 * PUT /api/departments/[id]
 * Update department
 */
async function putHandler(req, user, { params }) {
  const departmentId = params.id;
  const body = await req.json();

  // Validate input
  const validationResult = updateDepartmentSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const department = await updateDepartment(
    departmentId,
    validationResult.data,
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
 * DELETE /api/departments/[id]
 * Delete department (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const departmentId = params.id;

  const deleted = await deleteDepartment(departmentId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Department not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Department deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

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
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
