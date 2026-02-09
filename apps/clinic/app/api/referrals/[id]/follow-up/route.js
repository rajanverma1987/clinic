/**
 * Referral Follow-up Note API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { addFollowUpNoteSchema } from '@/lib/validations/referral';
import { addFollowUpNote } from '@/services/referral.service';

/**
 * POST /api/referrals/[id]/follow-up
 * Add follow-up note to referral
 */
async function postHandler(req, user, { params }) {
  const referralId = params.id;
  const body = await req.json();

  const validationResult = addFollowUpNoteSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const referral = await addFollowUpNote(referralId, validationResult.data.note, user.tenantId, user.userId);

  if (!referral) {
    return NextResponse.json(
      errorResponse('Referral not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(referral));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.UPDATE)(postHandler)
    )
  )
);
