/**
 * GET /api/patients/stats
 * Get patient statistics
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse } from '@/lib/utils/api-response';
import { getPatientStats } from '@/services/patient.service';

async function getHandler(req, user) {
  const stats = await getPatientStats(user.tenantId, user.userId);
  return NextResponse.json(successResponse(stats));
}

export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(getHandler)
    )
  )
);
