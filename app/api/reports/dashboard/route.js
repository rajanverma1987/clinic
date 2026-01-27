import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getDashboardStats } from '@/services/report.service';

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics
 */
async function getHandler(req, user) {
  const stats = await getDashboardStats(user.tenantId, user.userId);
  return NextResponse.json(successResponse(stats));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler)
    )
  )
);

