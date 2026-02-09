import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { addAddon, removeAddon } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/**
 * POST /api/subscriptions/:id/addons
 * Add an add-on to the tenant's subscription (for limited-plan users).
 * Body: { addonKey: string, quantity?: number, option?: string }
 */
async function postHandler(req, user, params) {
  try {
    const { id: subscriptionId } = params;
    const body = await req.json();
    const addonKey = body.addonKey;
    if (!addonKey) {
      return NextResponse.json(errorResponse('addonKey is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }
    const subscription = await addAddon(subscriptionId, user.tenantId, {
      addonKey,
      quantity: body.quantity,
      option: body.option,
    });
    return NextResponse.json(successResponse(subscription), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      errorResponse(error instanceof Error ? error.message : String(error), 'ADD_ADDON_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/subscriptions/:id/addons
 * Remove an add-on from the tenant's subscription.
 * Body: { addonKey: string }
 */
async function deleteHandler(req, user, params) {
  try {
    const { id: subscriptionId } = params;
    const body = await req.json().catch(() => ({}));
    const addonKey = body.addonKey;
    if (!addonKey) {
      return NextResponse.json(errorResponse('addonKey is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }
    const subscription = await removeAddon(subscriptionId, user.tenantId, addonKey);
    return NextResponse.json(successResponse(subscription), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      errorResponse(error instanceof Error ? error.message : String(error), 'REMOVE_ADDON_ERROR'),
      { status: 400 }
    );
  }
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user, params);
}

export async function DELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return deleteHandler(authenticatedReq, authResult.user, params);
}
