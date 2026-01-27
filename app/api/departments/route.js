/**
 * Department API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createDepartmentSchema, departmentQuerySchema } from '@/lib/validations/department';
import { createDepartment, listDepartments } from '@/services/department.service';

/**
 * GET /api/departments
 * List departments with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    status: searchParams.get('status') || undefined,
    headDoctor: searchParams.get('headDoctor') || undefined,
  };

  const validationResult = departmentQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listDepartments(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/departments
 * Create a new department
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createDepartmentSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const department = await createDepartment(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: department._id.toString(),
      name: department.name,
      code: department.code,
      status: department.status,
      createdAt: department.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.DEPARTMENT, ACTIONS.CREATE)(postHandler)
    )
  )
);
