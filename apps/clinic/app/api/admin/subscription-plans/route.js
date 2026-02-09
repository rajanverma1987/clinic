import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { createSubscriptionPlan, listSubscriptionPlans } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/subscription-plans
 * List all subscription plans (Admin only)
 */
async function getHandler(req, user) {
  // Check if user is super admin (you may need to add this check)
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  const plans = await listSubscriptionPlans(status);
  return NextResponse.json(successResponse(plans));
}

/**
 * POST /api/admin/subscription-plans
 * Create subscription plan (Admin only)
 */
async function postHandler(req, user) {
  // Check if user is super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  const body = await req.json();

    const plan = await createSubscriptionPlan({
      name: body.name,
      description: body.description,
      price: body.price, // Expected in cents
      currency: body.currency || 'USD',
      billingCycle: body.billingCycle,
      paypalPlanId: body.paypalPlanId, // Use provided PayPal Plan ID if available
      features: body.features || [],
      maxUsers: body.maxUsers,
      maxPatients: body.maxPatients,
      maxStorageGB: body.maxStorageGB,
      isPopular: body.isPopular || false,
      isHidden: body.isHidden || false,
    });

  return NextResponse.json(successResponse(plan), { status: 201 });
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

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SUBSCRIPTION:CREATE permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.CREATE)(postHandler))),
  ),
);
