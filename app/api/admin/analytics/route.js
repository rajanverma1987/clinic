/**
 * GET /api/admin/analytics
 * Platform analytics for Super Admin: user growth, revenue trend, popular specialties, peak hours.
 * Query: startDate, endDate (optional – filter months to range; default last 12 months).
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Invoice from '@/models/Invoice';
import Doctor from '@/models/Doctor';
import { logger } from '@/lib/utils/logger.js';

function getMonthKeys(lastN = 12, startDate, endDate) {
  const keys = [];
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getFullYear(), end.getMonth() - lastN + 1, 1);
  const from = new Date(start.getFullYear(), start.getMonth(), 1);
  let d = new Date(from);
  while (d <= end) {
    keys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
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

    // User growth (non-super_admin users created per month)
    const userGrowth = await Promise.all(
      months.map(async (m) => {
        const count = await User.countDocuments({
          role: { $ne: 'super_admin' },
          createdAt: { $gte: m.start, $lte: m.end },
        });
        return { label: m.label, value: count, key: m.key };
      })
    );

    // Revenue trend (invoice totalAmount per month)
    const revenueTrends = await Promise.all(
      months.map(async (m) => {
        const invoices = await Invoice.find({
          deletedAt: null,
          invoiceDate: { $gte: m.start, $lte: m.end },
        }).lean();
        const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        return { label: m.label, value: Math.round(total * 100) / 100, total, key: m.key };
      })
    );

    const Appointment = (await import('@/models/Appointment')).default;
    // Appointment trends (count per month) for compatibility with existing ChartCard
    const appointmentTrends = await Promise.all(
      months.map(async (m) => {
        const count = await Appointment.countDocuments({
          deletedAt: null,
          appointmentDate: { $gte: m.start, $lte: m.end },
        });
        return { label: m.label, value: count, key: m.key };
      })
    );

    // Popular specialties (from Doctor professional.specialization)
    const doctors = await Doctor.find({}).select('professional.specialization').lean();
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

    // Peak hours (simplified: from appointments last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentAppointments = await Appointment.find({
      deletedAt: null,
      appointmentDate: { $gte: ninetyDaysAgo },
    })
      .select('startTime appointmentDate')
      .lean();
    const byHour = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;
    recentAppointments.forEach((a) => {
      const t = a.startTime ? new Date(a.startTime) : a.appointmentDate ? new Date(a.appointmentDate) : null;
      if (t) byHour[t.getHours()]++;
    });
    const peakHours = Object.entries(byHour).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count,
    }));

    // Appointment stats for period (last 12 months or date range)
    const periodStart = months.length ? months[0].start : new Date(0);
    const periodEnd = months.length ? months[months.length - 1].end : new Date();
    const appointmentStatsResult = await Appointment.aggregate([
      { $match: { deletedAt: null, appointmentDate: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
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
      })
    );
  } catch (error) {
    logger.error('Admin analytics error:', error);
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to fetch analytics',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
