/**
 * Reviews API Route
 * Get public reviews/testimonials for homepage
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import Review from '@/models/Review';
import { NextResponse } from 'next/server';

/**
 * GET /api/reviews
 * Get featured reviews/testimonials (public endpoint)
 */
async function getHandler(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const minRating = parseInt(searchParams.get('minRating') || '4', 10);
  const sortBy = searchParams.get('sortBy') || 'rating';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    // Build query for top-rated reviews
    const query = {
      rating: { $gte: minRating },
      reviewText: { $exists: true, $ne: '' },
      deletedAt: null,
    };

    // Build sort object
    const sort = {};
    if (sortBy === 'rating') {
      sort.rating = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'date') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Get reviews with patient and doctor info
    const reviews = await Review.find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate')
      .sort(sort)
      .limit(limit)
      .lean();

    // Format reviews for testimonials
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      patientName: review.patientId
        ? `${review.patientId.firstName || ''} ${review.patientId.lastName || ''}`.trim() ||
          'Anonymous'
        : 'Anonymous',
      rating: review.rating,
      reviewText: review.reviewText || '',
      treatmentType: review.doctorId?.specialization || 'General Consultation', // API route - no i18n needed
      doctorName: review.doctorId?.name || 'Dr. Unknown', // API route - no i18n needed
      appointmentDate: review.appointmentId?.appointmentDate || review.createdAt,
      createdAt: review.createdAt,
      isVerified: review.isVerified || false,
    }));

    return NextResponse.json(
      successResponse({
        reviews: formattedReviews,
        total: formattedReviews.length,
      }),
    );
  } catch (err) {
    logger.error('Failed to fetch reviews:', err);
    return NextResponse.json(errorResponse('Failed to fetch reviews', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware (no auth required for public reviews)
export const GET = withErrorHandler(apiRateLimit(getHandler));
