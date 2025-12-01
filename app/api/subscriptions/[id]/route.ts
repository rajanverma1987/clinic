import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  activateSubscription,
  cancelSubscription,
  getSubscriptionPayments,
} from '@/services/subscription.service';

/**
 * POST /api/subscriptions/:id/activate
 * Activate subscription after PayPal approval
 */
async function activateHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    
    const subscription = await activateSubscription(id, user.tenantId);
    return NextResponse.json(successResponse(subscription));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to activate subscription', 'ACTIVATE_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * POST /api/subscriptions/:id/cancel
 * Cancel subscription
 */
async function cancelHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    const subscription = await cancelSubscription(
      id,
      user.tenantId,
      body.cancelAtPeriodEnd !== false
    );
    return NextResponse.json(successResponse(subscription));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to cancel subscription', 'CANCEL_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * GET /api/subscriptions/:id/payments
 * Get payments for subscription
 */
async function getPaymentsHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    
    const payments = await getSubscriptionPayments(id, user.tenantId);
    return NextResponse.json(successResponse(payments));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch payments', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'activate') {
    return activateHandler(authenticatedReq, authResult.user, params);
  } else if (action === 'cancel') {
    return cancelHandler(authenticatedReq, authResult.user, params);
  }

  return NextResponse.json(
    errorResponse('Invalid action', 'INVALID_ACTION'),
    { status: 400 }
  );
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'payments') {
    return getPaymentsHandler(authenticatedReq, authResult.user, params);
  }

  return NextResponse.json(
    errorResponse('Invalid request', 'INVALID_REQUEST'),
    { status: 400 }
  );
}

