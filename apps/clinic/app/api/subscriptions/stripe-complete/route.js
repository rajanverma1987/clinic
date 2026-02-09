import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { completeStripeSubscription } from '@/services/stripe-subscription.service';
import { NextResponse } from 'next/server';

/**
 * POST /api/subscriptions/stripe-complete
 * Complete subscription after Stripe Checkout (card payment).
 * Body: { sessionId }
 */
async function postHandler(req, user) {
  const body = await req.json();
  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json(errorResponse('sessionId is required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }
  const subscription = await completeStripeSubscription(sessionId, user.tenantId);
  return NextResponse.json(successResponse(subscription));
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
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.CREATE)(postHandler))),
  ),
);
