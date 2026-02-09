/**
 * Lab Test Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateLabTestSchema } from '@/lib/validations/lab';
import {
  getLabTestById,
  updateLabTest,
  deleteLabTest,
} from '@/services/lab-test.service';

/**
 * GET /api/lab-tests/[id]
 * Get lab test by ID
 */
async function getHandler(req, user, { params }) {
  const testId = params.id;

  const labTest = await getLabTestById(testId, user.tenantId, user.userId);

  if (!labTest) {
    return NextResponse.json(
      errorResponse('Lab test not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labTest));
}

/**
 * PUT /api/lab-tests/[id]
 * Update lab test
 */
async function putHandler(req, user, { params }) {
  const testId = params.id;
  const body = await req.json();

  const validationResult = updateLabTestSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labTest = await updateLabTest(
    testId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!labTest) {
    return NextResponse.json(
      errorResponse('Lab test not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labTest));
}

/**
 * DELETE /api/lab-tests/[id]
 * Delete lab test (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const testId = params.id;

  const deleted = await deleteLabTest(testId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Lab test not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Lab test deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_TEST, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_TEST, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_TEST, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
