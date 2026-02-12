import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Subscription from '@/models/Subscription';
import Tenant from '@/models/Tenant';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/clients
 * List all clients (tenants) with subscription info (Admin only)
 */
async function getHandler(req, user) {
  // Check if user is super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

    const tenants = await Tenant.find()
      .select('name slug region isActive suspended suspendReason createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get subscription info for each tenant
    const tenantsWithSubscriptions = await Promise.all(
      tenants.map(async (tenant) => {
        const subscription = await Subscription.findOne({ tenantId: tenant._id })
          .populate('planId', '_id name price billingCycle')
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...tenant,
          subscription: subscription || null,
        };
      }),
    );

  return NextResponse.json(successResponse(tenantsWithSubscriptions));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SUBSCRIPTION:READ permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.READ)(getHandler))),
  ),
);
