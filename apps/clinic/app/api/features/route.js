import { isTestAccount } from '@/lib/constants/test-account.js';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Tenant from '@/models/Tenant';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';
import { getTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/** Free trial duration in days per plan. Basic = 6 months; Smart Clinic & Enterprise = 3 months. */
const PLAN_FREE_TRIAL_DAYS = {
  Basic: 180, SOLO: 180, Core: 180,          // Basic / legacy Basic = 6 months
  'Smart Clinic': 90, CLINIC: 90, Pro: 90, Growth: 90, // Smart Clinic / legacy = 3 months
  Enterprise: 90, ENTERPRISE: 90,            // Enterprise = 3 months
};
const DEFAULT_FREE_TRIAL_DAYS = 180; // no subscription → assume Basic-level (6 months)

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
      addons: [{ addonKey: 'aiAssist' }],
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
        const [features, limits, subscription, tenant] = await Promise.all([
          getTenantFeatures(user.tenantId),
          getTenantLimits(user.tenantId),
          getTenantSubscription(user.tenantId),
          Tenant.findById(user.tenantId).select('createdAt').lean(),
        ]);
        const sub = subscription;

        // Calculate trial days remaining based on tenant creation date + plan-specific trial length.
        // Basic = 6 months (180 days); Smart Clinic & Enterprise = 3 months (90 days).
        const planName = sub?.planId?.name || null;
        const freeDays = planName ? (PLAN_FREE_TRIAL_DAYS[planName] ?? 90) : DEFAULT_FREE_TRIAL_DAYS;
        let trialDaysRemaining = null;
        if (tenant?.createdAt) {
          const trialEnd = new Date(tenant.createdAt);
          trialEnd.setDate(trialEnd.getDate() + freeDays);
          const now = new Date();
          if (trialEnd > now) {
            trialDaysRemaining = Math.max(
              0,
              Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            );
          } else {
            trialDaysRemaining = 0;
          }
        }

        // For a paid ACTIVE subscription: trial is over — suppress the trial banner
        const hasPaidActiveSub =
          sub &&
          sub.status === 'ACTIVE' &&
          sub.planId &&
          typeof sub.planId === 'object' &&
          (sub.planId.price ?? 0) > 0;
        if (hasPaidActiveSub) {
          trialDaysRemaining = null;
        }

        const addons = Array.isArray(sub?.addons) ? sub.addons.map((a) => ({ addonKey: a.addonKey })) : [];
        return {
          features,
          limits,
          subscription: sub
            ? {
                status: sub.status,
                currentPeriodEnd: sub.currentPeriodEnd,
                trialDaysRemaining,
                paypalApprovalUrl: sub.paypalApprovalUrl,
                addons,
              }
            : { status: null, currentPeriodEnd: null, trialDaysRemaining, paypalApprovalUrl: null, addons: [] },
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
