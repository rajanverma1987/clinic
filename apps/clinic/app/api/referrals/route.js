/**
 * Referral API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createReferralSchema, referralQuerySchema } from '@/lib/validations/referral';
import { createReferral, listReferrals } from '@/services/referral.service';

/**
 * GET /api/referrals
 * List referrals with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    referringDoctorId: searchParams.get('referringDoctorId') || undefined,
    referredToDoctorId: searchParams.get('referredToDoctorId') || undefined,
    referredToSpecialty: searchParams.get('referredToSpecialty') || undefined,
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') || undefined,
    type: searchParams.get('type') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = referralQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listReferrals(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/referrals
 * Create a new referral
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createReferralSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const referral = await createReferral(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: referral._id.toString(),
      referralNumber: referral.referralNumber,
      status: referral.status,
      createdAt: referral.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REFERRAL, ACTIONS.CREATE)(postHandler)
    )
  )
);
