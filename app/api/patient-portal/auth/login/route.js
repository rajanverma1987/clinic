/**
 * Patient Portal Login API Route
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { loginPatientSchema } from '@/lib/validations/patient-auth';
import { loginPatient } from '@/services/patient-auth.service';

/**
 * POST /api/patient-portal/auth/login
 * Login patient to portal
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

  const validationResult = loginPatientSchema.safeParse({ ...body, tenantId });
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await loginPatient(validationResult.data, tenantId);

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack (no auth required for login)
export const POST = withErrorHandler(
  apiRateLimit(postHandler)
);
