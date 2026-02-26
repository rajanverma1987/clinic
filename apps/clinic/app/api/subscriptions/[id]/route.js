import { errorResponse, successResponse } from '@/lib/utils/api-response';
import User from '@/models/User';
import {
  activateSubscription,
  cancelSubscription,
  getSubscriptionPayments,
  updateTenantSubscription,
} from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/** Only primary account (or super_admin) can manage subscription. Returns 403 response or null if allowed. */
async function requirePrimaryAccount(user) {
  if (user.role === 'super_admin') return null;
  const userDoc = await User.findById(user.userId).select('isPrimaryAccount').lean();
  if (userDoc?.isPrimaryAccount) return null;
  return NextResponse.json(
    errorResponse(
      'Only the primary account (registered with clinic details) can manage the subscription.',
      'PRIMARY_ACCOUNT_REQUIRED',
    ),
    { status: 403 },
  );
}

/**
 * POST /api/subscriptions/:id/activate
 * Activate subscription after PayPal approval
 */
async function activateHandler(req, user, params) {
  const forbidden = await requirePrimaryAccount(user);
  if (forbidden) return forbidden;
  try {
    const { id } = params;

    const subscription = await activateSubscription(id, user.tenantId);
    return NextResponse.json(successResponse(subscription));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) ||
          'Failed to activate subscription',
        'ACTIVATE_ERROR',
      ),
      { status: 400 },
    );
  }
}

/**
 * POST /api/subscriptions/:id/cancel
 * Cancel subscription
 */
async function cancelHandler(req, user, params) {
  const forbidden = await requirePrimaryAccount(user);
  if (forbidden) return forbidden;
  try {
    const { id } = params;
    const body = await req.json();

    const subscription = await cancelSubscription(
      id,
      user.tenantId,
      body.cancelAtPeriodEnd !== false,
    );
    return NextResponse.json(successResponse(subscription));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to cancel subscription',
        'CANCEL_ERROR',
      ),
      { status: 400 },
    );
  }
}

/**
 * GET /api/subscriptions/:id/payments
 * Get payments for subscription
 */
async function getPaymentsHandler(req, user, params) {
  try {
    const { id } = params;

    const payments = await getSubscriptionPayments(id, user.tenantId);
    return NextResponse.json(successResponse(payments));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to fetch payments',
        'FETCH_ERROR',
      ),
      { status: 400 },
    );
  }
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'activate') {
    return activateHandler(authenticatedReq, authResult.user, params);
  } else if (action === 'cancel') {
    return cancelHandler(authenticatedReq, authResult.user, params);
  }

  return NextResponse.json(errorResponse('Invalid action', 'INVALID_ACTION'), { status: 400 });
}

/**
 * PUT /api/subscriptions/:id?action=upgrade
 * Upgrade/change subscription plan
 */
async function upgradeHandler(req, user, params) {
  const forbidden = await requirePrimaryAccount(user);
  if (forbidden) return forbidden;
  try {
    const body = await req.json();

    if (!body.planId) {
      return NextResponse.json(errorResponse('Plan ID is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    const subscription = await updateTenantSubscription(user.tenantId, body.planId);
    return NextResponse.json(successResponse(subscription));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) ||
          'Failed to upgrade subscription',
        'UPGRADE_ERROR',
      ),
      { status: 400 },
    );
  }
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'upgrade') {
    return upgradeHandler(authenticatedReq, authResult.user, params);
  }

  return NextResponse.json(errorResponse('Invalid action', 'INVALID_ACTION'), { status: 400 });
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'payments') {
    return getPaymentsHandler(authenticatedReq, authResult.user, params);
  }

  return NextResponse.json(errorResponse('Invalid request', 'INVALID_REQUEST'), { status: 400 });
}
