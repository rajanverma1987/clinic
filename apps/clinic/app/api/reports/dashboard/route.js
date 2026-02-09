import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse } from '@/lib/utils/api-response';
import { getDashboardStats } from '@/services/report.service';
import CacheManager from '@/lib/cache/cache-manager.js';

/** Server-side cache TTL for dashboard stats (seconds). Redis optional; fails gracefully. */
const DASHBOARD_CACHE_TTL = 120;

/**
 * GET /api/reports/dashboard
 * Dashboard statistics. Cached per tenant (Redis if available); cache miss fetches from DB.
 */
async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;

  const cached = await CacheManager.get('reports', 'dashboard', tenantId);
  if (cached) {
    return NextResponse.json(successResponse(cached));
  }

  const stats = await getDashboardStats(user.tenantId, user.userId);
  await CacheManager.set('reports', stats, DASHBOARD_CACHE_TTL, 'dashboard', tenantId);
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

