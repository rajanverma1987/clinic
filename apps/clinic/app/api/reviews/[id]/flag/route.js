/**
 * Review flag API
 * PATCH /api/reviews/[id]/flag – set isFlagged on a review (doctor/admin/manager, same tenant)
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Review from '@/models/Review';
import { logger } from '@/lib/utils/logger';

const ALLOWED_ROLES = ['doctor', 'admin', 'manager', 'super_admin'];

async function patchHandler(req, user, { params }) {
  await connectDB();

  const reviewId = params?.id;
  if (!reviewId) {
    return NextResponse.json(errorResponse('Review ID required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  if (!ALLOWED_ROLES.includes(user?.role)) {
    return NextResponse.json(errorResponse('Forbidden', 'FORBIDDEN'), { status: 403 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json(errorResponse('Tenant context required', 'FORBIDDEN'), {
      status: 403,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const flagged = body.flagged === true;
    const flaggedReason = typeof body.flaggedReason === 'string' ? body.flaggedReason.trim() : undefined;

    const review = await Review.findOne({
      _id: reviewId,
      tenantId,
      deletedAt: null,
    }).lean();

    if (!review) {
      return NextResponse.json(errorResponse('Review not found', 'NOT_FOUND'), { status: 404 });
    }

    await Review.updateOne(
      { _id: reviewId, tenantId },
      {
        $set: {
          isFlagged: flagged,
          ...(flaggedReason !== undefined && { flaggedReason: flaggedReason || null }),
        },
      }
    );

    return NextResponse.json(
      successResponse({ updated: true, isFlagged: flagged })
    );
  } catch (err) {
    logger.error('Failed to flag review:', err);
    return NextResponse.json(
      errorResponse('Failed to update review flag', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export const PATCH = withErrorHandler(apiRateLimit(withAuth(patchHandler)));
