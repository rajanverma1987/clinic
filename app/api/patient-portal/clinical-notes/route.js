/**
 * Patient Portal Clinical Notes API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { listClinicalNotes } from '@/services/clinical-note.service';

/**
 * GET /api/patient-portal/clinical-notes
 * Get patient's clinical notes (medical records)
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
    type: searchParams.get('type') || undefined,
  };

  const result = await listClinicalNotes(query, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.CLINICAL_NOTE, ACTIONS.READ)(getHandler)
    )
  )
);
