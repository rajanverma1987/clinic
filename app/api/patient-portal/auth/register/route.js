/**
 * Patient Portal Registration API Route
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { registerPatientSchema } from '@/lib/validations/patient-auth';
import { registerPatient } from '@/services/patient-auth.service';

/**
 * POST /api/patient-portal/auth/register
 * Register patient for portal access
 */
async function postHandler(req) {
  const body = await req.json();

  // Extract tenantId from body or query
  const { searchParams } = new URL(req.url);
  const tenantId = body.tenantId || searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json(
      errorResponse('Tenant ID is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const validationResult = registerPatientSchema.safeParse({ ...body, tenantId });
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await registerPatient(validationResult.data, tenantId);

  return NextResponse.json(
    successResponse({
      message: 'Patient portal access enabled successfully',
      patient: result.patient,
    }),
    { status: 201 }
  );
}

// Apply middleware stack (no auth required for registration)
export const POST = withErrorHandler(
  apiRateLimit(postHandler)
);
