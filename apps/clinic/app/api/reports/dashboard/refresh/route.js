import { getClinicSummary } from '@clinic-saas/dashboard-engine';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

/**
 * POST /api/reports/dashboard/refresh
 * Force refresh dashboard stats via dashboard-engine.
 */
async function postHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    const stats = await getClinicSummary(tenantId, dashboardEngineAdapter);

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics refreshed',
    });
  } catch (error) {
    logger.error('Dashboard refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh dashboard statistics', error: error.message },
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.UPDATE)(postHandler))),
);
