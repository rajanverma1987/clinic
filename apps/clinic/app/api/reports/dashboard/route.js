import CacheManager from '@/lib/cache/cache-manager.js';
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

const DASHBOARD_CACHE_TTL = 300;

/**
 * GET /api/reports/dashboard
 * Dashboard statistics via dashboard-engine. Cache from background job or on-demand.
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    // Super admin has no tenantId; return empty stats (they use /admin/stats for platform data)
    if (user.role === 'super_admin' && !tenantId) {
      return NextResponse.json({
        ...successResponse({
          appointments: { today: 0, completed: 0, upcoming: 0 },
          revenue: { today: 0, monthTotal: 0 },
          patients: { total: 0, newThisMonth: 0 },
          invoices: { pending: 0, paid: 0 },
          lastUpdated: new Date().toISOString(),
        }),
        fromCache: false,
      });
    }

    if (!tenantId) {
      return NextResponse.json(errorResponse('Tenant context required', 'MISSING_TENANT'), {
        status: 400,
      });
    }

    let stats = await CacheManager.get('dashboard', 'stats', tenantId);
    if (!stats) {
      logger.debug('Cache miss - fetching clinic summary via dashboard-engine');
      stats = await getClinicSummary(tenantId, dashboardEngineAdapter);
      if (stats) await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);
    }

    return NextResponse.json({ ...successResponse(stats), fromCache: !!stats });
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
