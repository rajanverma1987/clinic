import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Review from '@/models/Review';
import { NextResponse } from 'next/server';

/**
 * GET /api/doctors/dashboard
 * Get all doctor dashboard data in a single optimized call
 */
async function getHandler(req, user) {
  await connectDB();

  if (user.role !== 'doctor') {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized - Doctor access only',
      },
      { status: 403 }
    );
  }

  try {
    // Get doctor profile
    const doctor = await Doctor.findOne({ userId: user._id, tenantId: user.tenantId }).lean();
    if (!doctor) {
      return NextResponse.json(errorResponse('Doctor profile not found'), { status: 404 });
    }

    const doctorId = doctor._id;
    const tenantId = user.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Calculate date ranges
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Parallel queries for better performance
    const [
      todayAppointments,
      yesterdayAppointments,
      totalPatients,
      pendingReviews,
      patientsWaiting,
      completedToday,
      revenueThisMonth,
      revenueLastMonth,
      earningsToday,
      reviewsData,
    ] = await Promise.all([
      // Today's appointments count
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: { $gte: today, $lte: todayEnd },
      }),

      // Yesterday's appointments for trend
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: {
          $gte: yesterday,
          $lt: today,
        },
      }),

      // Total patients (patients who have appointments with this doctor)
      Appointment.distinct('patientId', {
        tenantId,
        doctorId,
      }).then((patientIds) => patientIds.length),

      // Pending reviews (completed without clinical notes)
      Appointment.countDocuments({
        tenantId,
        doctorId,
        status: 'completed',
        hasClinicalNote: { $ne: true },
      }),

      // Patients waiting
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: { $gte: today, $lte: todayEnd },
        status: { $in: ['in_queue', 'arrived'] },
      }),

      // Completed today
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: { $gte: today, $lte: todayEnd },
        status: 'completed',
      }),

      // Revenue this month
      Appointment.aggregate([
        {
          $match: {
            tenantId,
            doctorId,
            status: 'completed',
            appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]).then((result) => result[0]?.totalRevenue || 0),

      // Revenue last month
      Appointment.aggregate([
        {
          $match: {
            tenantId,
            doctorId,
            status: 'completed',
            appointmentDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]).then((result) => result[0]?.totalRevenue || 0),

      // Earnings today
      Appointment.aggregate([
        {
          $match: {
            tenantId,
            doctorId,
            status: 'completed',
            appointmentDate: { $gte: today, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]).then((result) => result[0]?.totalRevenue || 0),

      // Reviews data
      Review.aggregate([
        {
          $match: {
            tenantId,
            doctorId,
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            reviewsWithResponse: {
              $sum: {
                $cond: [{ $ifNull: ['$doctorResponse', false] }, 1, 0],
              },
            },
          },
        },
      ]).then((result) => {
        const data = result[0] || { averageRating: 0, totalReviews: 0, reviewsWithResponse: 0 };
        return {
          averageRating: Math.round(data.averageRating * 10) / 10 || 0,
          totalReviews: data.totalReviews || 0,
          responseRate:
            data.totalReviews > 0
              ? Math.round((data.reviewsWithResponse / data.totalReviews) * 100)
              : 0,
        };
      }),
    ]);

    // Calculate trends
    const revenueTrend =
      revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;
    const appointmentsTrend =
      yesterdayAppointments > 0
        ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100
        : 0;

    return NextResponse.json(
      successResponse({
        totalPatients,
        todayAppointments,
        pendingReviews,
        patientsWaiting,
        completedConsultations: completedToday,
        revenue: revenueThisMonth,
        earningsToday,
        revenueTrend: Math.round(revenueTrend * 100) / 100,
        appointmentsTrend: Math.round(appointmentsTrend * 100) / 100,
        patientsTrend: 0,
        averageRating: reviewsData.averageRating,
        totalReviews: reviewsData.totalReviews,
        responseRate: reviewsData.responseRate,
        doctorId: doctorId.toString(),
      })
    );
  } catch (error) {
    logger.error('Error fetching doctor dashboard stats:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch dashboard statistics'),
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
