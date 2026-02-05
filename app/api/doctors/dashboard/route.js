import { getAuditLogs } from '@/lib/audit/audit-logger';
import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import LabOrder from '@/models/LabOrder';
import LabResult from '@/models/LabResult';
import Message from '@/models/Message';
import Prescription from '@/models/Prescription';
import Review from '@/models/Review';
import TelemedicineSession from '@/models/TelemedicineSession';
import { NextResponse } from 'next/server';

function formatActivityLabel(action, resource, details = {}) {
  const a = (action || '').toLowerCase();
  const r = (resource || '').toLowerCase();
  const actionLabels = {
    create: 'Created',
    read: 'Viewed',
    update: 'Updated',
    delete: 'Deleted',
    access: 'Accessed',
    export: 'Exported',
    login: 'Logged in',
    logout: 'Logged out',
  };
  const resourceLabels = {
    patient: 'patient',
    appointment: 'appointment',
    prescription: 'prescription',
    invoice: 'invoice',
    user: 'user',
    clinical_note: 'clinical note',
    lab_result: 'lab result',
    lab_order: 'lab order',
  };
  const verb = actionLabels[a] || a;
  const res = resourceLabels[r] || r;
  if (a === 'login' || a === 'logout') return `${verb}`;
  return `${verb} ${res}`;
}

/**
 * GET /api/doctors/dashboard
 * Get all doctor dashboard data in a single optimized call
 */
async function getHandler(req, user) {
  await connectDB();

  const role = (user.role || '').toLowerCase();
  if (role !== 'doctor') {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized - Doctor access only',
      },
      { status: 403 },
    );
  }

  try {
    // Get doctor profile; if none yet (e.g. new doctor), return empty stats so UI does not break
    const doctor = await Doctor.findOne({ userId: user.userId, tenantId: user.tenantId }).lean();
    if (!doctor) {
      return NextResponse.json(
        successResponse({
          totalPatients: 0,
          todayAppointments: 0,
          thisWeekAppointments: 0,
          thisMonthAppointments: 0,
          pendingReviews: 0,
          patientsWaiting: 0,
          completedConsultations: 0,
          revenue: 0,
          earningsToday: 0,
          revenueTrend: 0,
          appointmentsTrend: 0,
          patientsTrend: 0,
          averageRating: 0,
          totalReviews: 0,
          responseRate: 0,
          videoCallsThisMonth: 0,
          labReportsToReview: 0,
          newMessages: 0,
          prescriptionsToApprove: 0,
          recentActivity: [],
          doctorId: null,
        }),
      );
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
    // Week: Monday–Sunday
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

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
      thisWeekAppointments,
      thisMonthAppointments,
      videoCallsThisMonth,
      labReportsToReview,
      newMessages,
      prescriptionsToApprove,
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

      // This week appointments
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: { $gte: startOfWeek, $lte: endOfWeek },
      }),

      // This month appointments
      Appointment.countDocuments({
        tenantId,
        doctorId,
        appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
      }),

      // Video calls this month (sessions where doctorId is Doctor _id or User _id)
      TelemedicineSession.countDocuments({
        tenantId,
        doctorId: { $in: [doctorId, user.userId] },
        sessionType: 'VIDEO',
        scheduledStartTime: { $gte: startOfMonth, $lte: endOfMonth },
      }),

      // Lab reports to review (draft results for orders by this doctor)
      LabOrder.find({ tenantId, doctorId: user.userId })
        .select('_id')
        .lean()
        .then((orders) => orders.map((o) => o._id))
        .then((orderIds) =>
          orderIds.length
            ? LabResult.countDocuments({
                tenantId,
                status: 'draft',
                orderId: { $in: orderIds },
              })
            : 0,
        ),

      // New messages (unread inbox for this user)
      Message.getUnreadCount(user.userId, tenantId, 'inbox'),

      // Prescriptions to approve (draft by this doctor)
      Prescription.countDocuments({
        tenantId,
        doctorId: user.userId,
        status: 'draft',
      }),
    ]);

    // Calculate trends
    const revenueTrend =
      revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;
    const appointmentsTrend =
      yesterdayAppointments > 0
        ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100
        : 0;

    // Recent activity (last 5 actions) – non-blocking; return [] on error
    let recentActivity = [];
    try {
      const { logs } = await getAuditLogs({
        userId: user.userId,
        tenantId,
        limit: 5,
        skip: 0,
      });
      recentActivity = (logs || []).map((l) => ({
        _id: l._id?.toString(),
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId?.toString(),
        timestamp: l.timestamp,
        label: formatActivityLabel(l.action, l.resource, l.details),
      }));
    } catch (activityErr) {
      logger.warn('Doctor dashboard: recent activity fetch failed', activityErr);
    }

    return NextResponse.json(
      successResponse({
        totalPatients,
        todayAppointments,
        thisWeekAppointments,
        thisMonthAppointments,
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
        videoCallsThisMonth,
        labReportsToReview,
        newMessages,
        prescriptionsToApprove,
        recentActivity,
        doctorId: doctorId.toString(),
      }),
    );
  } catch (error) {
    logger.error('Error fetching doctor dashboard stats:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch dashboard statistics'),
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));
