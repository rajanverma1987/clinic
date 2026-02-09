/**
 * Lab Result API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createLabResultSchema, labResultQuerySchema } from '@/lib/validations/lab';
import { createLabResult, listLabResults } from '@/services/lab-result.service';

/**
 * GET /api/lab-results
 * List lab results with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    orderId: searchParams.get('orderId') || undefined,
    testId: searchParams.get('testId') || undefined,
    status: searchParams.get('status') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = labResultQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listLabResults(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/lab-results
 * Create a new lab result
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createLabResultSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labResult = await createLabResult(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: labResult._id.toString(),
      orderId: labResult.orderId.toString(),
      testId: labResult.testId.toString(),
      status: labResult.status,
      createdAt: labResult.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_RESULT, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_RESULT, ACTIONS.CREATE)(postHandler)
    )
  )
);
