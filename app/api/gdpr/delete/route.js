/**
 * GDPR Data Deletion API Route
 * Right to Erasure
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { deletePatientDataSchema } from '@/lib/validations/gdpr';
import { deletePatientData } from '@/services/gdpr.service';

/**
 * POST /api/gdpr/delete
 * Delete patient data (GDPR Right to Erasure)
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = deletePatientDataSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  if (!validationResult.data.confirm) {
    return NextResponse.json(
      errorResponse('Deletion must be confirmed', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const result = await deletePatientData(
    validationResult.data.patientId,
    user.tenantId,
    user.userId,
    validationResult.data.reason
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
