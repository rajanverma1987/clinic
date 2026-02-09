import { isTestAccount } from '@/lib/constants/test-account.js';
import connectDB from '@/lib/db/connection';
import { errorResponse, handleMongoError, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import User from '@/models/User';
import { getTenantSubscription } from '@/services/subscription.service.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Get current user profile
 */
async function handler(req, user) {
  try {
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
        tenantId: userDoc.tenantId
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
      role: userDoc.role,
      tenantId: userTenantId,
      tenant: tenantData,
      subscriptionPlan,
      isActive: userDoc.isActive,
      lastLoginAt: userDoc.lastLoginAt,
      createdAt: userDoc.createdAt,
    };
    if (userDoc.role === 'manager' && userDoc.managerAccess && userDoc.managerAccess.length > 0) {
      payload.managerAccess = userDoc.managerAccess;
    }
    return NextResponse.json(successResponse(payload), { headers: noCacheHeaders });
  } catch (error) {
    logger.error('[auth/me] Error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      userId: user?.userId,
      tenantId: user?.tenantId,
    });

    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), {
        status: 400,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
      });
    }

    return NextResponse.json(
      errorResponse(
        'Failed to fetch user profile',
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? error.message : null,
      ),
      { status: 500, headers: noCacheHeaders },
    );
  }
}

export const GET = withAuth(handler);
