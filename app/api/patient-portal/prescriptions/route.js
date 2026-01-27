/**
 * Patient Portal Prescriptions API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { listPrescriptions } from '@/services/prescription.service';

/**
 * GET /api/patient-portal/prescriptions
 * Get patient's prescriptions
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  // Get patientId from token or query
  const patientId = searchParams.get('patientId') || user.patientId;

  if (!patientId) {
    return NextResponse.json(
      errorResponse('Patient ID is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const query = {
    patientId,
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    status: searchParams.get('status') || undefined,
  };

  const result = await listPrescriptions(query, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PRESCRIPTION, ACTIONS.READ)(getHandler)
    )
  )
);
