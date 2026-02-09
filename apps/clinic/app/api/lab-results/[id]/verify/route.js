/**
 * Lab Result Verify API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { verifyLabResult } from '@/services/lab-result.service';

/**
 * POST /api/lab-results/[id]/verify
 * Verify lab result
 */
async function postHandler(req, user, { params }) {
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
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_RESULT, ACTIONS.VERIFY)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
