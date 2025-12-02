import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';
import { getTenantSubscription } from '@/services/subscription.service';

/**
 * GET /api/features
 * Get current tenant's available features, limits, and subscription status
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    // Super admin has access to all features
    if (user.role === 'super_admin') {
      return NextResponse.json(
        successResponse({
          features: ['*'], // All features
          limits: {},
          subscription: null,
        })
      );
    }

    const features = await getTenantFeatures(user.tenantId);
    const limits = await getTenantLimits(user.tenantId);
    const subscription = await getTenantSubscription(user.tenantId);

    // Calculate trial days remaining if on Free Trial
    let trialDaysRemaining: number | undefined;
    if (subscription && subscription.planId && typeof subscription.planId === 'object' && 'name' in subscription.planId) {
      const plan = subscription.planId as any;
      if (plan.name === 'Free Trial' && subscription.status === 'ACTIVE') {
        const now = new Date();
        const end = new Date(subscription.currentPeriodEnd);
        const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, daysRemaining);
      }
    }

    return NextResponse.json(
      successResponse({
        features,
        limits,
        subscription: subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialDaysRemaining,
          paypalApprovalUrl: subscription.paypalApprovalUrl,
        } : null,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch features', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);

