/**
 * Referral Status API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import { updateReferralStatus } from '@/services/referral.service';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']),
});

/**
 * PUT /api/referrals/[id]/status
 * Update referral status
 */
async function putHandler(req, user, { params }) {
  const referralId = params.id;
  const body = await req.json();

  const validationResult = updateStatusSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const referral = await updateReferralStatus(referralId, validationResult.data.status, user.tenantId, user.userId);

  if (!referral) {
    return NextResponse.json(
      errorResponse('Referral not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(referral));
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.UPDATE)(putHandler)
    )
  )
);
