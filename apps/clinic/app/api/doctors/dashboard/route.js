import { getDoctorSummary } from '@clinic-saas/dashboard-engine';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { NextResponse } from 'next/server';

const EMPTY_DOCTOR_RESPONSE = {
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
};

/**
 * GET /api/doctors/dashboard
 * Doctor dashboard data via dashboard-engine only. No direct DB access in route.
 */
async function getHandler(req, user) {
  const role = (user.role || '').toLowerCase();
  if (role !== 'doctor') {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Doctor access only' },
      { status: 403 },
    );
  }

  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;
    const userId = user.userId || user._id;

    const data = await getDoctorSummary(tenantId, userId, dashboardEngineAdapter);

    return NextResponse.json(
      successResponse(data ?? EMPTY_DOCTOR_RESPONSE),
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
