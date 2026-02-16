import CacheManager from '@/lib/cache/cache-manager.js';
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
 * Dashboard statistics. Uses pre-computed cache from background job (every 5 min).
 * Falls back to real-time calculation if cache miss.
 * In-memory cache (OptimizedCacheManager) ensures sub-ms hits even when Redis is unavailable.
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    // In-memory LRU cache (always available, no Redis dependency)
    const stats = await optimizedCacheManager.getOrFetch(
      `dashboard:stats:${tenantId}`,
      async () => {
        // Redis cache (populated by background job every 5 min)
        const cached = await CacheManager.get('dashboard', 'stats', tenantId);
        if (cached) return cached;

        // On-demand fallback calculation
        logger.debug('Cache miss - calculating dashboard stats on demand');
        const dashboardStatsModule = await import('@/jobs/dashboard-stats.js');
        const computed = await dashboardStatsModule.calculateDashboardStats(tenantId);
        await CacheManager.set('dashboard', computed, DASHBOARD_CACHE_TTL, 'stats', tenantId);
        return computed;
      },
      DASHBOARD_CACHE_TTL_MS,
    );

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
