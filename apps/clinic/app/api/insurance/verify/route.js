/**
 * Insurance Verification API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { verifyInsuranceSchema } from '@/lib/validations/insurance';
import { verifyInsuranceEligibility } from '@/services/insurance.service';

/**
 * POST /api/insurance/verify?patientId=xxx
 * Verify insurance eligibility
 */
async function postHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json(
      errorResponse('Patient ID is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const body = await req.json();

  const validationResult = verifyInsuranceSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const verification = await verifyInsuranceEligibility(
    patientId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse(verification));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(postHandler)
    )
  )
);
