import { getClinicSummary, getClinicSummaryFromMetrics } from '@clinic-saas/dashboard-engine';
import ClinicDashboardMetrics from '@/models/ClinicDashboardMetrics.js';
import CacheManager from '@/lib/cache/cache-manager.js';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

/** Server-side cache TTL for dashboard stats (seconds). Redis optional; fails gracefully. */
const DASHBOARD_CACHE_TTL = 300; // 5 minutes - matches background job interval
const DASHBOARD_CACHE_TTL_MS = DASHBOARD_CACHE_TTL * 1000;

/**
 * GET /api/dashboard/stats
 * Dashboard statistics via dashboard-engine only. Uses pre-computed cache from background job (every 5 min).
 * Falls back to engine.getClinicSummary (adapter uses DB) on cache miss.
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    // Prefer clinic_dashboard_metrics (aggregated table) – no live queries
    const metrics = await ClinicDashboardMetrics.findOne({ tenantId }).lean();
    let stats;
    if (metrics?.data) {
      stats = getClinicSummaryFromMetrics(metrics);
    } else {
      stats = await optimizedCacheManager.getOrFetch(
        `dashboard:stats:${tenantId}`,
        async () => {
          const cached = await CacheManager.get('dashboard', 'stats', tenantId);
          if (cached && typeof cached === 'object' && (cached.appointments || cached.revenue)) {
            const m = { data: cached, updated_at: cached.lastUpdated || new Date() };
            return getClinicSummaryFromMetrics(m);
          }
          logger.debug('Cache miss - fetching clinic summary via dashboard-engine');
          const computed = await getClinicSummary(tenantId, dashboardEngineAdapter);
          await CacheManager.set('dashboard', computed, DASHBOARD_CACHE_TTL, 'stats', tenantId);
          return computed;
        },
        DASHBOARD_CACHE_TTL_MS,
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
      fromCache: !!stats,
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
