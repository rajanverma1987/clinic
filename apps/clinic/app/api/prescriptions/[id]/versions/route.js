/**
 * Prescription version history API – list versions for a prescription
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getPrescriptionVersionHistory } from '@/services/prescription-version.service';
import { getPrescriptionById } from '@/services/prescription.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const prescriptionId = params.id;
  const prescription = await getPrescriptionById(prescriptionId, user.tenantId, user.userId);
  if (!prescription) {
    return NextResponse.json(errorResponse('Prescription not found', 'NOT_FOUND'), { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const query = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
  };

  const result = await getPrescriptionVersionHistory(prescriptionId, user.tenantId, query);
  return NextResponse.json(successResponse(result));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PRESCRIPTION, ACTIONS.READ)(getHandler))),
);
