/**
 * Doctor dashboard data – all DB access for doctor KPIs.
 * Used by dashboard-engine adapter only; UI never touches this directly.
 */

import { getAuditLogs } from '@/lib/audit/audit-logger';
import connectDB from '@/lib/db/connection';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import LabOrder from '@/models/LabOrder';
import LabResult from '@/models/LabResult';
import Message from '@/models/Message';
import Prescription from '@/models/Prescription';
import Review from '@/models/Review';
import TelemedicineSession from '@/models/TelemedicineSession';

function formatActivityLabel(action, resource) {
  const a = (action || '').toLowerCase();
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
  const res = resourceLabels[(resource || '').toLowerCase()] || resource;
  if (a === 'login' || a === 'logout') return `${verb}`;
  return `${verb} ${res}`;
}

/**
 * Fetch all doctor dashboard data (KPIs + recent activity). Used by dashboard-engine adapter.
 *
 * @param {string} tenantId
 * @param {string} userId
 * @returns {Promise<Object|null>} Raw doctor KPIs + recentActivity, doctorId; null if not a doctor or no profile
 */
export async function getDoctorDashboardData(tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne({ userId, tenantId }).lean();
  if (!doctor) return null;

  const doctorId = doctor._id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

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
    reviewsResult,
    thisWeekAppointments,
    thisMonthAppointments,
    videoCallsThisMonth,
    labReportsToReview,
    newMessages,
    prescriptionsToApprove,
    auditLogsResult,
  ] = await Promise.all([
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: today, $lte: todayEnd },
    }),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: yesterday, $lt: today },
    }),
    Appointment.distinct('patientId', { tenantId, doctorId }).then((ids) => ids.length),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      status: 'completed',
      hasClinicalNote: { $ne: true },
    }),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: today, $lte: todayEnd },
      status: { $in: ['in_queue', 'arrived'] },
    }),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: today, $lte: todayEnd },
      status: 'completed',
    }),
    Appointment.aggregate([
      {
        $match: {
          tenantId,
          doctorId,
          status: 'completed',
          appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]).then((r) => r[0]?.totalRevenue || 0),
    Appointment.aggregate([
      {
        $match: {
          tenantId,
          doctorId,
          status: 'completed',
          appointmentDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]).then((r) => r[0]?.totalRevenue || 0),
    Appointment.aggregate([
      {
        $match: {
          tenantId,
          doctorId,
          status: 'completed',
          appointmentDate: { $gte: today, $lte: todayEnd },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]).then((r) => r[0]?.totalRevenue || 0),
    Review.aggregate([
      { $match: { tenantId, doctorId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          reviewsWithResponse: {
            $sum: { $cond: [{ $ifNull: ['$doctorResponse', false] }, 1, 0] },
          },
        },
      },
    ]).then((r) => {
      const d = r[0] || { averageRating: 0, totalReviews: 0, reviewsWithResponse: 0 };
      return {
        averageRating: Math.round((d.averageRating || 0) * 10) / 10,
        totalReviews: d.totalReviews || 0,
        responseRate:
          d.totalReviews > 0 ? Math.round((d.reviewsWithResponse / d.totalReviews) * 100) : 0,
      };
    }),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: startOfWeek, $lte: endOfWeek },
    }),
    Appointment.countDocuments({
      tenantId,
      doctorId,
      appointmentDate: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    TelemedicineSession.countDocuments({
      tenantId,
      doctorId: { $in: [doctorId, userId] },
      sessionType: 'VIDEO',
      scheduledStartTime: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    LabOrder.find({ tenantId, doctorId: userId })
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
    Message.getUnreadCount(userId, tenantId, 'inbox'),
    Prescription.countDocuments({
      tenantId,
      doctorId: userId,
      status: 'draft',
    }),
    getAuditLogs({ userId, tenantId, limit: 5, skip: 0 })
      .then(({ logs }) =>
        (logs || []).map((l) => ({
          _id: l._id?.toString(),
          action: l.action,
          resource: l.resource,
          resourceId: l.resourceId?.toString(),
          timestamp: l.timestamp,
          label: formatActivityLabel(l.action, l.resource),
        })),
      )
      .catch(() => []),
  ]);

  const revenueTrend =
    revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;
  const appointmentsTrend =
    yesterdayAppointments > 0
      ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100
      : 0;

  return {
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
    averageRating: reviewsResult.averageRating,
    totalReviews: reviewsResult.totalReviews,
    responseRate: reviewsResult.responseRate,
    videoCallsThisMonth,
    labReportsToReview,
    newMessages,
    prescriptionsToApprove,
    recentActivity: Array.isArray(auditLogsResult) ? auditLogsResult : [],
    doctorId: doctorId.toString(),
  };
}
