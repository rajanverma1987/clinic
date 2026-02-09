/**
 * Insurance Claim Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateInsuranceClaimSchema } from '@/lib/validations/insurance';
import {
  getInsuranceClaimById,
  updateInsuranceClaim,
  deleteInsuranceClaim,
} from '@/services/insurance.service';

/**
 * GET /api/insurance/claims/[id]
 * Get insurance claim by ID
 */
async function getHandler(req, user, { params }) {
  const claimId = params.id;

  const claim = await getInsuranceClaimById(claimId, user.tenantId, user.userId);

  if (!claim) {
    return NextResponse.json(
      errorResponse('Insurance claim not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(claim));
}

/**
 * PUT /api/insurance/claims/[id]
 * Update insurance claim
 */
async function putHandler(req, user, { params }) {
  const claimId = params.id;
  const body = await req.json();

  const validationResult = updateInsuranceClaimSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const claim = await updateInsuranceClaim(
    claimId,
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

/**
 * DELETE /api/insurance/claims/[id]
 * Delete insurance claim (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const claimId = params.id;

  const deleted = await deleteInsuranceClaim(claimId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Insurance claim not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Insurance claim deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

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

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
