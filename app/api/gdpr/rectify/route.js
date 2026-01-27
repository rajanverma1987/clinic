/**
 * GDPR Data Rectification API Route
 * Right to Rectification
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { rectifyPatientDataSchema } from '@/lib/validations/gdpr';
import { rectifyPatientData } from '@/services/gdpr.service';

/**
 * POST /api/gdpr/rectify
 * Rectify patient data (GDPR Right to Rectification)
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = rectifyPatientDataSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await rectifyPatientData(
    validationResult.data.patientId,
    validationResult.data.corrections,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(postHandler)
    )
  )
);
