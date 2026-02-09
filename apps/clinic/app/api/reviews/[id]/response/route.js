/**
 * Doctor response to review API
 * PATCH /api/reviews/[id]/response – set doctorResponse (doctor only, must own the review)
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Review from '@/models/Review';
import Doctor from '@/models/Doctor';
import { logger } from '@/lib/utils/logger';

async function patchHandler(req, user, { params }) {
  await connectDB();

  const reviewId = params?.id;
  if (!reviewId) {
    return NextResponse.json(errorResponse('Review ID required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  if (user?.role !== 'doctor') {
    return NextResponse.json(errorResponse('Only doctors can respond to reviews', 'FORBIDDEN'), {
      status: 403,
    });
  }

  const tenantId = user.tenantId;
  const userId = user.userId ?? user.id ?? user._id;
  if (!tenantId || !userId) {
    return NextResponse.json(errorResponse('Tenant and user context required', 'FORBIDDEN'), {
      status: 403,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.doctorResponse === 'string' ? body.doctorResponse.trim() : (typeof body.text === 'string' ? body.text.trim() : '');
    if (!text) {
      return NextResponse.json(errorResponse('Response text required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    const doctor = await Doctor.findOne({ userId, tenantId }).select('_id').lean();
    if (!doctor) {
      return NextResponse.json(errorResponse('Doctor profile not found', 'NOT_FOUND'), {
        status: 404,
      });
    }

    const review = await Review.findOne({
      _id: reviewId,
      tenantId,
      doctorId: doctor._id,
      deletedAt: null,
    }).lean();

    if (!review) {
      return NextResponse.json(errorResponse('Review not found', 'NOT_FOUND'), { status: 404 });
    }

    const respondedAt = new Date();
    await Review.updateOne(
      { _id: reviewId, tenantId },
      {
        $set: {
          'doctorResponse.text': text,
          'doctorResponse.respondedAt': respondedAt,
        },
      }
    );

    return NextResponse.json(
      successResponse({
        updated: true,
        doctorResponse: { text, respondedAt: respondedAt.toISOString() },
      })
    );
  } catch (err) {
    logger.error('Failed to save doctor response to review:', err);
    return NextResponse.json(
      errorResponse('Failed to save response', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export const PATCH = withErrorHandler(apiRateLimit(withAuth(patchHandler)));
