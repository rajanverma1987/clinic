import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { listSubscriptionPlans } from '@/services/subscription.service';
import { PlanStatus } from '@/models/SubscriptionPlan';

/**
 * GET /api/subscription-plans
 * List active subscription plans (Public)
 */
async function getHandler(req: AuthenticatedRequest) {
  try {
    // Exclude hidden plans from public pricing page
    const plans = await listSubscriptionPlans(PlanStatus.ACTIVE, true);
    return NextResponse.json(successResponse(plans));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch subscription plans', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) {
    // Allow public access to subscription plans - exclude hidden plans
    try {
      const plans = await listSubscriptionPlans(PlanStatus.ACTIVE, true);
      return NextResponse.json(successResponse(plans));
    } catch (error: any) {
      return NextResponse.json(
        errorResponse(error.message || 'Failed to fetch subscription plans', 'FETCH_ERROR'),
        { status: 400 }
      );
    }
  }
  
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;
  return getHandler(authenticatedReq);
}

