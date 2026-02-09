import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { createPayPalPlan } from '@/services/paypal.service';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/subscription-plans/create-paypal-plan
 * Create PayPal billing plan on-the-fly
 * Admin only
 */
async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.name || !body.price || !body.currency || !body.billingCycle) {
    return NextResponse.json(
      errorResponse(
        'Missing required fields: name, price, currency, billingCycle',
        'VALIDATION_ERROR',
      ),
      { status: 400 },
    );
  }

  // Create PayPal plan
  const paypalPlanId = await createPayPalPlan(
    body.name,
    body.description || `${body.name} subscription plan`,
    body.price, // In dollars
    body.currency,
    body.billingCycle,
  );

  return NextResponse.json(
    successResponse({
      paypalPlanId,
      message: 'PayPal billing plan created successfully',
    }),
  );
}

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
