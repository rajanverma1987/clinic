import connectDB from '@/lib/db/connection';
import { isTestAccount } from '@/lib/constants/test-account.js';
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

    // Get tenantId before populating (to avoid object conversion issues)
    // tenantId is an ObjectId at this point, not a populated object
    const userTenantId = userDoc.tenantId ? userDoc.tenantId.toString() : '';

    // Populate tenant for response (handle case where tenantId might not exist)
    try {
      if (userDoc.tenantId) {
        await userDoc.populate('tenantId', 'name slug region settings');
      }
    } catch (populateError) {
      logger.error('Error populating tenant:', populateError);
      // Continue without populated tenant - it's not critical
    }

    // Verify tenant access - allow if user has no tenantId or if tenantIds match (skip for test account)
    const dbTenantId = userTenantId;
    const tokenTenantId = user.tenantId || '';

    if (!(user.email && isTestAccount(user.email)) && dbTenantId && tokenTenantId && dbTenantId !== tokenTenantId) {
      logger.error('Tenant mismatch:', {
        dbTenantId,
        tokenTenantId,
        userId: user.userId,
        userDocTenantId: userDoc.tenantId,
        userTenantId: user.tenantId,
      });
      return NextResponse.json(errorResponse('Access denied', 'FORBIDDEN'), {
        status: 403,
        headers: noCacheHeaders,
      });
    }

    // Safely get tenant data (might be populated object or null)
    let tenantData = null;
    if (userDoc.tenantId) {
      if (typeof userDoc.tenantId === 'object' && userDoc.tenantId !== null) {
        // Populated tenant object
        tenantData = {
          id: userDoc.tenantId._id?.toString() || userDoc.tenantId.id,
          name: userDoc.tenantId.name,
          slug: userDoc.tenantId.slug,
          region: userDoc.tenantId.region,
          settings: userDoc.tenantId.settings,
        };
      } else {
        // Just the ID
        tenantData = { id: userDoc.tenantId.toString() };
      }
    }

    // Subscription plan for clinic users (sidebar profile)
    let subscriptionPlan = null;
    if (userTenantId && userDoc.role !== 'super_admin') {
      try {
        const subscription = await getTenantSubscription(userTenantId);
        if (subscription?.planId?.name) {
          subscriptionPlan = { name: subscription.planId.name };
        }
      } catch (subErr) {
        logger.warn('[auth/me] Could not load subscription plan:', subErr?.message);
      }
    }

    return NextResponse.json(
      successResponse({
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
      }),
      { headers: noCacheHeaders }
    );
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
        process.env.NODE_ENV === 'development' ? error.message : null
      ),
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export const GET = withAuth(handler);
