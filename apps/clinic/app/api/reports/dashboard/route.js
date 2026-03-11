import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getClinicSummary } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

/**
 * GET /api/reports/dashboard
 * Dashboard statistics via dashboard-engine (direct fetch).
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    if (user.role === 'super_admin' && !tenantId) {
      return NextResponse.json({
        ...successResponse({
          appointments: { today: 0, completed: 0, upcoming: 0 },
          revenue: { today: 0, monthTotal: 0 },
          patients: { total: 0, newThisMonth: 0 },
          invoices: { pending: 0, paid: 0 },
          lastUpdated: new Date().toISOString(),
        }),
      });
    }

    if (!tenantId) {
      return NextResponse.json(errorResponse('Tenant context required', 'MISSING_TENANT'), {
        status: 400,
      });
    }

    const stats = await getClinicSummary(tenantId, dashboardEngineAdapter);
    return NextResponse.json(successResponse(stats));
  } catch (error) {
    logger.error('Reports dashboard fetch failed', { message: error?.message });
    return NextResponse.json(
      errorResponse('Failed to fetch dashboard statistics', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
