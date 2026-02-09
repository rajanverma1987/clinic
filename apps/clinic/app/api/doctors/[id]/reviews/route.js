/**
 * Doctor Reviews API Route
 * Get reviews for a specific doctor
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Review from '@/models/Review';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/doctors/[id]/reviews
 * Get reviews for a doctor (public endpoint)
 */
async function getHandler(req, { params }) {
  await connectDB();

  const doctorId = params.id;
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  try {
    // Build query
    const query = {
      doctorId,
      deletedAt: null,
    };

    if (tenantId) {
      query.tenantId = tenantId;
    }

    // Get reviews
    const reviews = await Review.find(query)
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId', 'appointmentDate startTime')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Format reviews (doctorResponse as string for display; isFlagged for UI)
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      appointmentId: review.appointmentId?._id,
      patientId: review.patientId?._id,
      patientName: review.patientId
        ? `${review.patientId.firstName} ${review.patientId.lastName || ''}`
        : 'Anonymous',
      rating: review.rating,
      reviewText: review.reviewText || '',
      appointmentDate: review.appointmentId?.appointmentDate || review.appointmentId?.startTime,
      createdAt: review.createdAt,
      doctorResponse: review.doctorResponse?.text ?? review.doctorResponse ?? null,
      isVerified: review.isVerified,
      isFlagged: review.isFlagged === true,
      helpfulCount: review.helpfulCount || 0,
    }));

    // Calculate average rating using model method
    const stats = await Review.getAverageRating(doctorId, tenantId);

    return NextResponse.json(
      successResponse({
        reviews: formattedReviews,
        averageRating: stats.averageRating,
        totalReviews: stats.totalReviews,
      })
    );
  } catch (err) {
    logger.error('Failed to fetch doctor reviews:', err);
    return NextResponse.json(errorResponse('Failed to fetch reviews', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware (no auth required for public reviews)
export const GET = withErrorHandler(apiRateLimit(getHandler));
