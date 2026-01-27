/**
 * Doctor Search API Route
 * Public endpoint for searching doctors with filters
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/doctors/search
 * Search doctors with filters (public endpoint)
 */
async function getHandler(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const location = searchParams.get('location') || '';
  const specialty = searchParams.get('specialty') || '';
  const gender = searchParams.get('gender') || '';
  const minRating = searchParams.get('minRating') || '';
  const minExperience = searchParams.get('minExperience') || '';
  const consultationType = searchParams.get('consultationType') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    // Build filter query
    const filter = {
      deletedAt: null,
      status: 'active',
    };

    // For public search, we might want to search across all tenants or a specific tenant
    // For now, we'll search within a default tenant or make it tenant-agnostic
    // You may need to adjust this based on your multi-tenant strategy

    // Specialty filter
    if (specialty) {
      filter['professional.specialization'] = { $in: [new RegExp(specialty, 'i')] };
    }

    // Experience filter
    if (minExperience) {
      filter['professional.experienceYears'] = { $gte: parseInt(minExperience) };
    }

    // Build search query for name
    let searchFilter = {};
    if (search) {
      // We'll need to join with User model for name search
      // For now, we'll fetch all and filter, or use aggregation
    }

    // Get doctors with populated user data
    const doctors = await Doctor.find(filter)
      .populate('userId', 'firstName lastName email phone profilePhoto')
      .lean();

    // Filter by search term (name)
    let filteredDoctors = doctors;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDoctors = doctors.filter(
        (doctor) =>
          doctor.userId?.firstName?.toLowerCase().includes(searchLower) ||
          doctor.userId?.lastName?.toLowerCase().includes(searchLower) ||
          doctor.professional?.specialization?.some((s) =>
            s.toLowerCase().includes(searchLower)
          )
      );
    }

    // Filter by gender (if user model has gender field)
    if (gender) {
      filteredDoctors = filteredDoctors.filter((doctor) => {
        // Assuming gender might be in user or doctor profile
        return true; // Adjust based on your schema
      });
    }

    // Filter by rating
    if (minRating) {
      filteredDoctors = filteredDoctors.filter(
        (doctor) => (doctor.rating || 0) >= parseFloat(minRating)
      );
    }

    // Sort results
    switch (sortBy) {
      case 'rating':
        filteredDoctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        filteredDoctors.sort(
          (a, b) =>
            (b.professional?.experienceYears || 0) - (a.professional?.experienceYears || 0)
        );
        break;
      case 'fees-low':
        filteredDoctors.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
        break;
      case 'fees-high':
        filteredDoctors.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
        break;
      default:
        // Relevance - keep original order or sort by rating
        filteredDoctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

    // Format response
    const formattedDoctors = paginatedDoctors.map((doctor) => ({
      _id: doctor._id,
      userId: doctor.userId,
      professional: doctor.professional,
      consultationFee: doctor.consultationFee,
      videoConsultationFee: doctor.videoConsultationFee,
      followUpFee: doctor.followUpFee,
      rating: doctor.rating || 0,
      totalReviews: doctor.totalReviews || 0,
      bio: doctor.bio,
      schedule: doctor.schedule,
      insuranceAccepted: doctor.insuranceAccepted || [],
    }));

    return NextResponse.json(
      successResponse({
        doctors: formattedDoctors,
        pagination: {
          page,
          limit,
          total: filteredDoctors.length,
          totalPages: Math.ceil(filteredDoctors.length / limit),
        },
      })
    );
  } catch (err) {
    logger.error('Doctor search error:', err);
    return NextResponse.json(errorResponse('Failed to search doctors', 'SEARCH_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware (no auth required for public search)
export const GET = withErrorHandler(apiRateLimit(getHandler));
