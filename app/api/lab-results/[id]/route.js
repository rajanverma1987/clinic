/**
 * Lab Result Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateLabResultSchema } from '@/lib/validations/lab';
import {
  getLabResultById,
  updateLabResult,
  verifyLabResult,
} from '@/services/lab-result.service';

/**
 * GET /api/lab-results/[id]
 * Get lab result by ID
 */
async function getHandler(req, user, { params }) {
  const resultId = params.id;

  const labResult = await getLabResultById(resultId, user.tenantId, user.userId);

  if (!labResult) {
    return NextResponse.json(
      errorResponse('Lab result not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labResult));
}

/**
 * PUT /api/lab-results/[id]
 * Update lab result
 */
async function putHandler(req, user, { params }) {
  const resultId = params.id;
  const body = await req.json();

  const validationResult = updateLabResultSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labResult = await updateLabResult(
    resultId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!labResult) {
    return NextResponse.json(
      errorResponse('Lab result not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labResult));
}

/**
 * POST /api/lab-results/[id]/verify
 * Verify lab result
 */
async function postVerifyHandler(req, user, { params }) {
  const resultId = params.id;

  const labResult = await verifyLabResult(resultId, user.tenantId, user.userId);

  if (!labResult) {
    return NextResponse.json(
      errorResponse('Lab result not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labResult));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_RESULT, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_RESULT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);
