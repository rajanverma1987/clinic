import { isTestAccount } from '@/lib/constants/test-account.js';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';
import { getTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

const FEATURES_CACHE_TTL_MS = 60000;

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
  // Super admin = company account: full access, no plan gating
    if (user.role === 'super_admin') {
      return NextResponse.json(
        successResponse({
          features: ['*'],
          limits: {},
          subscription: null,
        }),
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

    const cacheKey = `features:${user.tenantId}`;
    const payload = await optimizedCacheManager.getOrFetch(
      cacheKey,
      async () => {
        const features = await getTenantFeatures(user.tenantId);
        const limits = await getTenantLimits(user.tenantId);
        const subscription = await getTenantSubscription(user.tenantId);
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
        return {
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
        };
      },
      FEATURES_CACHE_TTL_MS,
    );

    return NextResponse.json(successResponse(payload));
  }

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SETTINGS:READ permission (features are part of settings)
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);
