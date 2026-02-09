import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { completeStripeSubscription } from '@/services/stripe-subscription.service';

/**
 * POST /api/subscriptions/stripe-complete
 * Complete subscription after Stripe Checkout (card payment).
 * Body: { sessionId }
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();
    const { sessionId } = body;
    if (!sessionId) {
      return NextResponse.json(
        errorResponse('sessionId is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    const subscription = await completeStripeSubscription(sessionId, user.tenantId);
    return NextResponse.json(successResponse(subscription));
  } catch (error) {
    return NextResponse.json(
      errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to complete subscription', 'COMPLETE_ERROR'),
      { status: 400 }
    );
  }
}

export const POST = withAuth(postHandler);
