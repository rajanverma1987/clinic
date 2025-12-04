import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';
import { getTenantSubscription } from '@/services/subscription.service';

/**
 * GET /api/features
 * Get current tenant's available features, limits, and subscription status
 */
async function getHandler(req, user) {
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
    let trialDaysRemaining;
    const sub = subscription;
    if (sub && sub.planId && typeof sub.planId === 'object' && 'name' in sub.planId) {
      const plan = sub.planId;
      if (plan.name === 'Free Trial' && sub.status === 'ACTIVE') {
        const now = new Date();
        const end = new Date(sub.currentPeriodEnd);
        const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, daysRemaining);
      }
    }

    return NextResponse.json(
      successResponse({
        features,
        limits,
        subscription: sub ? {
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          trialDaysRemaining,
          paypalApprovalUrl: sub.paypalApprovalUrl,
        } : null,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse((error instanceof Error ? error.message : String(error)) || 'Failed to fetch features', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);

