/**
 * GET /api/admin/analytics
 * Platform analytics for Super Admin: user growth, revenue trend, popular specialties, peak hours.
 * Query: startDate, endDate (optional – filter months to range; default last 12 months).
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import Doctor from '@/models/Doctor';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import { NextResponse } from 'next/server';

function getMonthKeys(lastN = 12, startDate, endDate) {
  const keys = [];
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getFullYear(), end.getMonth() - lastN + 1, 1);
  const from = new Date(start.getFullYear(), start.getMonth(), 1);
  let d = new Date(from);
  while (d <= end) {
    keys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return keys.slice(-lastN);
}

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const months = getMonthKeys(12, startDate, endDate);
    const Appointment = (await import('@/models/Appointment')).default;

    const monthStart = months[0]?.start ?? new Date(0);
    const monthEnd = months[months.length - 1]?.end ?? new Date();

    // Single aggregations per collection (faster than 12 queries each)
    const [userGrowthAgg, revenueAgg, appointmentTrendsAgg] = await Promise.all([
      User.aggregate([
        {
          $match: { role: { $ne: 'super_admin' }, createdAt: { $gte: monthStart, $lte: monthEnd } },
        },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { deletedAt: null, invoiceDate: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: { y: { $year: '$invoiceDate' }, m: { $month: '$invoiceDate' } },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),
      Appointment.aggregate([
        { $match: { deletedAt: null, appointmentDate: { $gte: monthStart, $lte: monthEnd } } },
        {
          $group: {
            _id: { y: { $year: '$appointmentDate' }, m: { $month: '$appointmentDate' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byKey = (arr, keyField) => {
      const map = {};
      arr.forEach((r) => {
        const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
        map[key] = r[keyField];
      });
      return map;
    };
    const userByKey = byKey(userGrowthAgg, 'count');
    const revenueByKey = byKey(revenueAgg, 'total');
    const appointmentsByKey = byKey(appointmentTrendsAgg, 'count');

    const userGrowth = months.map((m) => ({
      label: m.label,
      value: userByKey[m.key] ?? 0,
      key: m.key,
    }));
    const revenueTrends = months.map((m) => {
      const total = revenueByKey[m.key] ?? 0;
      return { label: m.label, value: Math.round(total * 100) / 100, total, key: m.key };
    });
    const appointmentTrends = months.map((m) => ({
      label: m.label,
      value: appointmentsByKey[m.key] ?? 0,
      key: m.key,
    }));

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [doctors, recentAppointments, appointmentStatsResult] = await Promise.all([
      Doctor.find({}).select('professional.specialization').lean(),
      Appointment.find({
        deletedAt: null,
        appointmentDate: { $gte: ninetyDaysAgo },
      })
        .select('startTime appointmentDate')
        .lean(),
      Appointment.aggregate([
        { $match: { deletedAt: null, appointmentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const specCount = {};
    doctors.forEach((d) => {
      const specs = d.professional?.specialization;
      if (Array.isArray(specs)) {
        specs.forEach((s) => {
          const name = (s && String(s).trim()) || 'Other';
          specCount[name] = (specCount[name] || 0) + 1;
        });
      } else if (specs) {
        const name = String(specs).trim() || 'Other';
        specCount[name] = (specCount[name] || 0) + 1;
      }
    });
    const popularSpecialties = Object.entries(specCount)
      .map(([name, count]) => ({ name, count, _id: name }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byHour = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    recentAppointments.forEach((a) => {
      const t = a.startTime
        ? new Date(a.startTime)
        : a.appointmentDate
          ? new Date(a.appointmentDate)
          : null;
      if (t) byHour[t.getHours()]++;
    });
    const peakHours = Object.entries(byHour).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count,
    }));
    const appointmentStats = { total: 0, completed: 0, cancelled: 0, no_show: 0 };
    appointmentStatsResult.forEach((s) => {
      appointmentStats.total += s.count;
      if (s._id === 'completed') appointmentStats.completed = s.count;
      else if (s._id === 'cancelled') appointmentStats.cancelled = s.count;
      else if (s._id === 'no_show') appointmentStats.no_show = s.count;
    });

    return NextResponse.json(
      successResponse({
        userGrowth,
        revenueTrends,
        appointmentTrends,
        popularSpecialties,
        peakHours,
        appointmentStats,
        geographicDistribution: [],
      }),
    );
  } catch (error) {
    logger.error('Admin analytics error:', error);
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to fetch analytics',
        'FETCH_ERROR',
      ),
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);
