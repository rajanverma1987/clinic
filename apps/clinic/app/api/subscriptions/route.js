import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import User from '@/models/User';
import {
  createSubscription,
  getTenantSubscription,
  listSubscriptions,
} from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/subscriptions
 * Get current tenant's subscription or list all (admin)
 */
async function getHandler(req, user) {
  // If super admin, list all subscriptions
  if (user.role === 'super_admin') {
    const subscriptions = await listSubscriptions();
    return NextResponse.json(successResponse(subscriptions));
  }

  // Otherwise, get tenant's subscription
  const subscription = await getTenantSubscription(user.tenantId);
  return NextResponse.json(successResponse(subscription));
}

/**
 * POST /api/subscriptions
 * Create subscription for tenant. Payment: PayPal only.
 * Only the primary account (registered with full clinic details) can purchase. Super Admin can create for any tenant.
 */
async function postHandler(req, user) {
  const body = await req.json();
  if (!body.planId) {
    return NextResponse.json(errorResponse('Plan ID is required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  if (user.role !== 'super_admin') {
    const userDoc = await User.findById(user.userId).select('isPrimaryAccount').lean();
    if (!userDoc?.isPrimaryAccount) {
      return NextResponse.json(
        errorResponse(
          'Only the primary account (registered with clinic details) can purchase a plan. Staff or doctor accounts created by admin cannot purchase.',
          'PRIMARY_ACCOUNT_REQUIRED',
        ),
        { status: 403 },
      );
    }
  }

  const paymentMethod = 'paypal';
  const trialOnly = body.trialOnly === true;
  const result = await createSubscription(
    user.tenantId,
    body.planId,
    user.userId,
    body.customerEmail,
    body.customerName,
    paymentMethod,
    trialOnly,
  );

  return NextResponse.json(successResponse(result), { status: 201 });
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
 * 6. Handler - Executes business logic
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
 * 5. Permission check - Validates SUBSCRIPTION:CREATE permission (or MANAGE for super admin)
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.CREATE)(postHandler))),
  ),
);
