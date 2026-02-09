/**
 * GDPR Data Anonymization API Route
 * Right to Object to Processing
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { anonymizePatientDataSchema } from '@/lib/validations/gdpr';
import { anonymizePatientData } from '@/services/gdpr.service';

/**
 * POST /api/gdpr/anonymize
 * Anonymize patient data (GDPR Right to Object)
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = anonymizePatientDataSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await anonymizePatientData(
    validationResult.data.patientId,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack (admin only - sensitive operation)
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.DELETE)(postHandler)
    )
  )
);
