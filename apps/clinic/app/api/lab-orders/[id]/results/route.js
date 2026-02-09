/**
 * Lab Order Results API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getResultsByOrderId } from '@/services/lab-result.service';

/**
 * GET /api/lab-orders/[id]/results
 * Get all results for a lab order
 */
async function getHandler(req, user, { params }) {
  const orderId = params.id;

  const results = await getResultsByOrderId(orderId, user.tenantId, user.userId);

  return NextResponse.json(successResponse(results));
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
