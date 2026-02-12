/**
 * GET /api/admin/analytics
 * Platform analytics for Super Admin: user growth, revenue trend, popular specialties, peak hours.
 * Query: startDate, endDate (optional – filter months to range; default last 12 months).
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Doctor from '@/models/Doctor';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import Subscription from '@/models/Subscription';
import Tenant from '@/models/Tenant';
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

  // Subscription growth (by month), plan distribution, churn, top clinics, payment rates
  const [
    subscriptionGrowthAgg,
    planDistributionAgg,
    subsByStatus,
    tenantRevenueAgg,
    paymentStatusAgg,
  ] = await Promise.all([
    Subscription.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          new: { $sum: 1 },
        },
      },
    ]),
    Subscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$planId', count: { $sum: 1 } } },
      {
        $lookup: { from: 'subscriptionplans', localField: '_id', foreignField: '_id', as: 'plan' },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
    ]),
    Subscription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Invoice.aggregate([
      {
        $match: {
          deletedAt: null,
          status: 'PAID',
          invoiceDate: { $gte: monthStart, $lte: monthEnd },
        },
      },
      { $group: { _id: '$tenantId', total: { $sum: '$totalAmount' } } },
      { $lookup: { from: 'tenants', localField: '_id', foreignField: '_id', as: 'tenant' } },
      { $unwind: { path: '$tenant', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const subGrowthByKey = {};
  subscriptionGrowthAgg.forEach((r) => {
    const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
    subGrowthByKey[key] = r.new ?? 0;
  });
  const subscriptionGrowth = months.map((m) => ({
    label: m.label,
    value: subGrowthByKey[m.key] ?? 0,
    key: m.key,
  }));

  const planDistribution = planDistributionAgg.map((p) => ({
    name: p.plan?.name || p._id?.toString() || 'Unknown',
    count: p.count,
    _id: p._id?.toString(),
  }));

  const subsStatusMap = {};
  subsByStatus.forEach((s) => {
    subsStatusMap[s._id] = s.count;
  });
  const totalSubs = Object.values(subsStatusMap).reduce((a, b) => a + b, 0);
  const newSubs = subscriptionGrowth.reduce((a, b) => a + b.value, 0);
  const cancelledSubs = subsStatusMap.CANCELLED ?? 0;
  const churnRate = totalSubs > 0 ? Math.round((cancelledSubs / totalSubs) * 10000) / 100 : 0;

  const activeTenantCount = await Tenant.countDocuments({ isActive: true });
  const totalRevenuePeriod = revenueTrends.reduce((a, b) => a + (b.total ?? 0), 0);
  const avgRevenuePerClinic =
    activeTenantCount > 0 ? Math.round((totalRevenuePeriod / activeTenantCount) * 100) / 100 : 0;

  const paymentStatusMap = {};
  paymentStatusAgg.forEach((p) => {
    paymentStatusMap[(p._id || '').toLowerCase()] = p.count;
  });
  const paymentSuccess = paymentStatusMap.completed ?? 0;
  const paymentFailure = paymentStatusMap.failed ?? 0;
  const paymentTotal = paymentSuccess + paymentFailure || 1;

  const topClinicsByRevenue = tenantRevenueAgg.map((r) => ({
    tenantId: r._id?.toString(),
    tenantName: r.tenant?.name || 'Unknown',
    total: r.total ?? 0,
  }));

  return NextResponse.json(
    successResponse({
      userGrowth,
      revenueTrends,
      appointmentTrends,
      popularSpecialties,
      peakHours,
      appointmentStats,
      geographicDistribution: [],
      subscriptionGrowth,
      planDistribution,
      churnRate,
      newSubscriptions: newSubs,
      cancelledSubscriptions: cancelledSubs,
      avgRevenuePerClinic,
      paymentSuccessRate: Math.round((paymentSuccess / paymentTotal) * 10000) / 100,
      paymentFailureRate: Math.round((paymentFailure / paymentTotal) * 10000) / 100,
      topClinicsByRevenue,
    }),
  );
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(withRequestLogger(apiRateLimit(withAuth(getHandler))));
