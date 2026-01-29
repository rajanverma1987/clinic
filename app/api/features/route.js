import { isTestAccount } from '@/lib/constants/test-account.js';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';
import { getTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/** TEMPORARY: Premium subscription payload for test account. REMOVE before production. */
function getTestAccountPremiumPayload() {
  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 1);
  return {
    features: ['*'],
    limits: { maxUsers: 500, maxPatients: 500000, maxStorageGB: 5000 },
    subscription: {
      status: 'ACTIVE',
      currentPeriodEnd: farFuture.toISOString(),
      trialDaysRemaining: null,
      paypalApprovalUrl: null,
    },
  };
}

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

    // TEMPORARY: Test account gets premium access. REMOVE before production.
    if (user.email && isTestAccount(user.email)) {
      return NextResponse.json(successResponse(getTestAccountPremiumPayload()));
    }

    if (!user.tenantId) {
      return NextResponse.json(errorResponse('Tenant context required', 'MISSING_TENANT'), {
        status: 400,
      });
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
        subscription: sub
          ? {
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
              trialDaysRemaining,
              paypalApprovalUrl: sub.paypalApprovalUrl,
            }
          : null,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isServerError =
      message.includes('MONGODB') ||
      message.includes('connection') ||
      message.includes('tenantId') ||
      message.length > 100;
    return NextResponse.json(errorResponse(message || 'Failed to fetch features', 'FETCH_ERROR'), {
      status: isServerError ? 500 : 400,
    });
  }
}

export const GET = withAuth(getHandler);
