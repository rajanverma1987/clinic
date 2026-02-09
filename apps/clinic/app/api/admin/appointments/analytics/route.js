/**
 * Admin Appointment Analytics (Super Admin only)
 * GET /api/admin/appointments/analytics?startDate=&endDate=
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Appointment from '@/models/Appointment';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const query = { deletedAt: null, appointmentDate: { $gte: start, $lte: end } };
    const appointments = await Appointment.find(query).lean();

    const total = appointments.length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const noShow = appointments.filter((a) => a.status === 'no_show').length;
    const completionRate = total ? (completed / total) * 100 : 0;
    const cancellationRate = total ? (cancelled / total) * 100 : 0;
    const noShowRate = total ? (noShow / total) * 100 : 0;

    const withDuration = appointments.filter((a) => a.startedAt && a.completedAt);
    const avgDurationMinutes = withDuration.length
      ? withDuration.reduce(
          (sum, a) => sum + (new Date(a.completedAt) - new Date(a.startedAt)) / 60000,
          0,
        ) / withDuration.length
      : 0;

    const byHour = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    appointments.forEach((a) => {
      const t = a.startTime
        ? new Date(a.startTime)
        : a.appointmentDate
          ? new Date(a.appointmentDate)
          : null;
      if (t) byHour[t.getHours()]++;
    });
    const peakHours = Object.entries(byHour)
      .map(([h, c]) => ({ hour: parseInt(h, 10), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const byDoctor = {};
    appointments.forEach((a) => {
      const id = (a.doctorId && a.doctorId.toString()) || 'unknown';
      if (!byDoctor[id]) byDoctor[id] = { total: 0, completed: 0, cancelled: 0 };
      byDoctor[id].total++;
      if (a.status === 'completed') byDoctor[id].completed++;
      if (a.status === 'cancelled') byDoctor[id].cancelled++;
    });
    const doctorStats = Object.entries(byDoctor).map(([doctorId, s]) => ({
      doctorId,
      total: s.total,
      completed: s.completed,
      cancelled: s.cancelled,
      completionRate: s.total ? (s.completed / s.total) * 100 : 0,
    }));

    const data = {
      total,
      completed,
      cancelled,
      noShow,
      completionRate: Math.round(completionRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      avgConsultationDurationMinutes: Math.round(avgDurationMinutes * 10) / 10,
      peakHours,
      doctorStats: doctorStats.sort((a, b) => b.total - a.total).slice(0, 20),
      dateRange: { start: start.toISOString(), end: end.toISOString() },
    };

  return NextResponse.json(successResponse(data));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates REPORT:READ permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
  ),
);
