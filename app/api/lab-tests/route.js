/**
 * Lab Test API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createLabTestSchema, labTestQuerySchema } from '@/lib/validations/lab';
import { createLabTest, listLabTests } from '@/services/lab-test.service';

/**
 * GET /api/lab-tests
 * List lab tests with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    status: searchParams.get('status') || undefined,
    category: searchParams.get('category') || undefined,
    department: searchParams.get('department') || undefined,
    sampleType: searchParams.get('sampleType') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const validationResult = labTestQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listLabTests(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/lab-tests
 * Create a new lab test
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createLabTestSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labTest = await createLabTest(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: labTest._id.toString(),
      testCode: labTest.testCode,
      name: labTest.name,
      status: labTest.status,
      createdAt: labTest.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_TEST, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_TEST, ACTIONS.CREATE)(postHandler)
    )
  )
);
