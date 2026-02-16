import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { withRequestLogger } from '@/middleware/request-logger';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { getAllLots } from '@/services/inventory.service';
import { successResponse } from '@/lib/utils/api-response';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';

/**
 * GET /api/inventory/lots
 * Get all lots/batches from inventory items
 *
 * @enterprise
 * - Full middleware stack: error handling, request logging, rate limiting, auth, permissions
 * - Tenant isolation enforced
 * - Audit logging included in service layer
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const filters = {
    expiringSoon: searchParams.get('expiringSoon') === 'true',
    expired: searchParams.get('expired') === 'true',
  };

  const isDashboardQuery = filters.expiringSoon && !filters.expired;
  const lots = isDashboardQuery
    ? await optimizedCacheManager.getOrFetch(
        `inventory:lots:expiringSoon:${user.tenantId}`,
        () => getAllLots(user.tenantId, user.userId, filters),
        60000,
      )
    : await getAllLots(user.tenantId, user.userId, filters);

  return NextResponse.json(successResponse(lots));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates INVENTORY:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(getHandler)))
  )
);

