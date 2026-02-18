import { getClinicSummary } from '@clinic-saas/dashboard-engine';
import CacheManager from '@/lib/cache/cache-manager.js';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

const DASHBOARD_CACHE_TTL = 300;

/**
 * GET /api/reports/dashboard
 * Dashboard statistics via dashboard-engine. Cache from background job or on-demand.
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    let stats = await CacheManager.get('dashboard', 'stats', tenantId);
    if (!stats) {
      logger.debug('Cache miss - fetching clinic summary via dashboard-engine');
      stats = await getClinicSummary(tenantId, dashboardEngineAdapter);
      if (stats) await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);
    }

    return NextResponse.json({ success: true, data: stats, fromCache: !!stats });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard statistics', error: error.message },
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
