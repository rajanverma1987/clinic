/**
 * Patient Portal Profile API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updatePatientProfileSchema } from '@/lib/validations/patient-auth';
import {
  getPatientProfile,
  updatePatientProfile,
} from '@/services/patient-auth.service';

/**
 * GET /api/patient-portal/profile
 * Get patient profile
 */
async function getHandler(req, user) {
  // Get patientId from token or query
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId') || user.patientId;

  if (!patientId) {
    return NextResponse.json(
      errorResponse('Patient ID is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const profile = await getPatientProfile(patientId, user.tenantId, user.userId);

  if (!profile) {
    return NextResponse.json(
      errorResponse('Patient profile not found or portal access not enabled', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(profile));
}

/**
 * PUT /api/patient-portal/profile
 * Update patient profile
 */
async function putHandler(req, user) {
  const body = await req.json();

  // Get patientId from token or body
  const patientId = body.patientId || user.patientId;

  if (!patientId) {
    return NextResponse.json(
      errorResponse('Patient ID is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const validationResult = updatePatientProfileSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const updated = await updatePatientProfile(
    patientId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!updated) {
    return NextResponse.json(
      errorResponse('Patient profile not found or portal access not enabled', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(updated));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(getHandler)
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(putHandler)
    )
  )
);
