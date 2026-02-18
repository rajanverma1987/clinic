import { validateAdapter } from '../context.js';

/**
 * Doctor dashboard summary. Uses adapter only; no DB access.
 *
 * @param {string} tenantId
 * @param {string} userId
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<DoctorSummary|null>} null if user is not a doctor or no profile
 */
export async function getDoctorSummary(tenantId, userId, adapter) {
  validateAdapter(adapter);
  if (!tenantId || !userId) return null;

  const raw = await adapter.getDoctorDashboard(tenantId, userId);
  if (!raw) return null;

  return {
    totalPatients: raw.totalPatients ?? 0,
    todayAppointments: raw.todayAppointments ?? 0,
    thisWeekAppointments: raw.thisWeekAppointments ?? 0,
    thisMonthAppointments: raw.thisMonthAppointments ?? 0,
    pendingReviews: raw.pendingReviews ?? 0,
    patientsWaiting: raw.patientsWaiting ?? 0,
    completedConsultations: raw.completedConsultations ?? 0,
    revenue: raw.revenue ?? 0,
    earningsToday: raw.earningsToday ?? 0,
    revenueTrend: raw.revenueTrend ?? 0,
    appointmentsTrend: raw.appointmentsTrend ?? 0,
    patientsTrend: raw.patientsTrend ?? 0,
    averageRating: raw.averageRating ?? 0,
    totalReviews: raw.totalReviews ?? 0,
    responseRate: raw.responseRate ?? 0,
    videoCallsThisMonth: raw.videoCallsThisMonth ?? 0,
    labReportsToReview: raw.labReportsToReview ?? 0,
    newMessages: raw.newMessages ?? 0,
    prescriptionsToApprove: raw.prescriptionsToApprove ?? 0,
    recentActivity: Array.isArray(raw.recentActivity) ? raw.recentActivity : [],
    doctorId: raw.doctorId ?? null,
  };
}
