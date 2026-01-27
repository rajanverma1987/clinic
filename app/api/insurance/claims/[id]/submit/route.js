/**
 * Submit Insurance Claim API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { submitInsuranceClaim } from '@/services/insurance.service';

/**
 * POST /api/insurance/claims/[id]/submit
 * Submit insurance claim
 */
async function postHandler(req, user, { params }) {
  const claimId = params.id;

  const claim = await submitInsuranceClaim(claimId, user.tenantId, user.userId);

  if (!claim) {
    return NextResponse.json(
      errorResponse('Insurance claim not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(claim));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
