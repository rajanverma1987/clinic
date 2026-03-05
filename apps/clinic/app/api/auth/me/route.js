import { isTestAccount } from '@/lib/constants/test-account.js';
import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import User from '@/models/User';
import { getTenantSubscription } from '@/services/subscription.service.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Get current user profile
 */
async function handler(req, user) {
  await connectDB();

  const userDoc = await User.findById(user.userId).select('-password');

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
  };

  if (!userDoc) {
    return NextResponse.json(errorResponse('User not found', 'NOT_FOUND'), {
      status: 404,
      headers: noCacheHeaders,
    });
  }

  const userTenantId = userDoc.tenantId ? userDoc.tenantId.toString() : '';

  const tokenTenantId = user.tenantId || '';
  if (
    !(user.email && isTestAccount(user.email)) &&
    userTenantId &&
    tokenTenantId &&
    userTenantId !== tokenTenantId
  ) {
    logger.error('Tenant mismatch:', {
      dbTenantId: userTenantId,
      tokenTenantId,
      userId: user.userId,
    });
    return NextResponse.json(errorResponse('Access denied', 'FORBIDDEN'), {
      status: 403,
      headers: noCacheHeaders,
    });
  }

  // Run populate and subscription fetch in parallel
  const [populateResult, subscription] = await Promise.all([
    userDoc.tenantId
      ? userDoc.populate('tenantId', 'name slug region settings').catch((e) => e)
      : Promise.resolve(null),
    userTenantId && userDoc.role !== 'super_admin'
      ? getTenantSubscription(userTenantId).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Check if populate failed (result is an Error instance)
  if (populateResult instanceof Error) {
    logger.error('Error populating tenant:', {
      error: populateResult.message,
      stack: populateResult.stack,
      userId: userDoc._id,
      tenantId: userDoc.tenantId,
    });
  }

  let tenantData = null;
  if (userDoc.tenantId) {
    if (typeof userDoc.tenantId === 'object' && userDoc.tenantId !== null) {
      tenantData = {
        id: userDoc.tenantId._id?.toString() || userDoc.tenantId.id,
        name: userDoc.tenantId.name,
        slug: userDoc.tenantId.slug,
        region: userDoc.tenantId.region,
        settings: userDoc.tenantId.settings,
      };
    } else {
      tenantData = { id: userDoc.tenantId.toString() };
    }
  }

  const subscriptionPlan =
    subscription?.planId?.name != null ? { name: subscription.planId.name } : null;

  const payload = {
    id: userDoc._id.toString(),
    email: userDoc.email,
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    firstName_ar: userDoc.firstName_ar || undefined,
    lastName_ar: userDoc.lastName_ar || undefined,
    firstName_es: userDoc.firstName_es || undefined,
    lastName_es: userDoc.lastName_es || undefined,
    role: userDoc.role,
    tenantId: userTenantId,
    tenant: tenantData,
    subscriptionPlan,
    isActive: userDoc.isActive,
    avatar: userDoc.avatar || undefined,
    lastLoginAt: userDoc.lastLoginAt,
    createdAt: userDoc.createdAt,
    isPrimaryAccount: !!userDoc.isPrimaryAccount,
  };
  if (userDoc.role === 'manager' && userDoc.managerAccess && userDoc.managerAccess.length > 0) {
    payload.managerAccess = userDoc.managerAccess;
  }
  return NextResponse.json(successResponse(payload), { headers: noCacheHeaders });
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Handler - Executes business logic
 *
 * Note: No permission check needed - users can always access their own profile
 */
export const GET = withErrorHandler(withRequestLogger(apiRateLimit(withAuth(handler))));
