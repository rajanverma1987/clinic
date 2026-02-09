/**
 * Referral Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateReferralSchema } from '@/lib/validations/referral';
import { getReferralById, updateReferral } from '@/services/referral.service';

/**
 * GET /api/referrals/[id]
 * Get referral by ID
 */
async function getHandler(req, user, { params }) {
  const referralId = params.id;

  const referral = await getReferralById(referralId, user.tenantId, user.userId);

  if (!referral) {
    return NextResponse.json(
      errorResponse('Referral not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(referral));
}

/**
 * PUT /api/referrals/[id]
 * Update referral
 */
async function putHandler(req, user, { params }) {
  const referralId = params.id;
  const body = await req.json();

  const validationResult = updateReferralSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const referral = await updateReferral(referralId, validationResult.data, user.tenantId, user.userId);

  if (!referral) {
    return NextResponse.json(
      errorResponse('Referral not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(referral));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.READ)(getHandler)
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.UPDATE)(putHandler)
    )
  )
);
