/**
 * Update Insurance Claim Status API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateClaimStatusSchema } from '@/lib/validations/insurance';
import { updateClaimStatus } from '@/services/insurance.service';

/**
 * PUT /api/insurance/claims/[id]/status
 * Update insurance claim status
 */
async function putHandler(req, user, { params }) {
  const claimId = params.id;
  const body = await req.json();

  const validationResult = updateClaimStatusSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const claim = await updateClaimStatus(
    claimId,
    validationResult.data.status,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!claim) {
    return NextResponse.json(
      errorResponse('Insurance claim not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(claim));
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);
