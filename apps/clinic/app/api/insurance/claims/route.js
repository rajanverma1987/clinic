/**
 * Insurance Claims API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createInsuranceClaimSchema, insuranceClaimQuerySchema } from '@/lib/validations/insurance';
import { createInsuranceClaim, listInsuranceClaims } from '@/services/insurance.service';

/**
 * GET /api/insurance/claims
 * List insurance claims with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    invoiceId: searchParams.get('invoiceId') || undefined,
    status: searchParams.get('status') || undefined,
    insuranceProvider: searchParams.get('insuranceProvider') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = insuranceClaimQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listInsuranceClaims(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/insurance/claims
 * Create a new insurance claim
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createInsuranceClaimSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const claim = await createInsuranceClaim(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: claim._id.toString(),
      claimNumber: claim.claimNumber,
      invoiceId: claim.invoiceId.toString(),
      status: claim.status,
      claimAmount: claim.claimAmount,
      createdAt: claim.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.CREATE)(postHandler)
    )
  )
);
