/**
 * GET /api/dashboard/all
 * Single aggregated dashboard: stats + lists + charts in one response.
 * Replaces multiple dashboard requests with one; all DB work in parallel.
 */

import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter.js';
import connectDB from '@/lib/db/connection.js';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants.js';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import Appointment from '@/models/Appointment.js';
import ClinicDashboardMetrics from '@/models/ClinicDashboardMetrics.js';
import InventoryItem from '@/models/InventoryItem.js';
import Invoice from '@/models/Invoice.js';
import Patient from '@/models/Patient.js';
import Queue from '@/models/Queue.js';
import { getPatientFlow, getRevenueTrend } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

const val = (result, fallback) => (result?.status === 'fulfilled' ? result.value : fallback);

async function getDashboardAll(tenantId, userId, role) {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
  const isDoctor = role === 'doctor';
  const tenantObj = tenantId;

  const apptMatch = { tenantId: tenantObj, deletedAt: null };
  const apptMatchToday = {
    ...apptMatch,
    appointmentDate: { $gte: todayStart, $lte: todayEnd },
  };
  if (isDoctor && userId) {
    apptMatch.doctorId = userId;
    apptMatchToday.doctorId = userId;
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const trendsPromise = isDoctor
    ? Promise.resolve({ revenue: null, patientFlow: null })
    : Promise.all([
        getRevenueTrend(tenantObj, { period: 'day' }, dashboardEngineAdapter),
        getPatientFlow(tenantObj, { period: 'day' }, dashboardEngineAdapter),
      ]).then(([revenue, patientFlow]) => ({
        revenue: revenue ?? null,
        patientFlow: patientFlow ?? null,
      }));

  const [
    statsResult,
    revenueResult,
    patientCountsResult,
    pendingInvoicesCountResult,
    todayAppointments,
    recentPatients,
    overdueInvoices,
    lowStock,
    queueItems,
    expiringLots,
    pendingRequests,
    chartRevenue,
    chartAppointments,
    chartPatients,
    trendsResult,
    failedTxResult,
  ] = await Promise.allSettled([
    Promise.all([
      Appointment.countDocuments({ ...apptMatchToday }),
      Appointment.countDocuments({ ...apptMatchToday, status: 'completed' }),
      Appointment.countDocuments({
        ...apptMatch,
        status: { $in: ['scheduled', 'pending'] },
      }),
    ]),
    isDoctor
      ? { todayPaid: 0, monthTotal: 0 }
      : Invoice.aggregate([
          {
            $match: {
              tenantId: tenantObj,
              deletedAt: null,
              status: 'paid',
              createdAt: { $gte: startOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              todayPaid: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$createdAt', todayStart] },
                        { $lte: ['$createdAt', todayEnd] },
                      ],
                    },
                    '$total',
                    0,
                  ],
                },
              },
              monthTotal: { $sum: '$total' },
            },
          },
        ]).then((r) => ({
          todayPaid: r[0]?.todayPaid ?? 0,
          monthTotal: r[0]?.monthTotal ?? 0,
        })),
    Promise.all([
      Patient.countDocuments({ tenantId: tenantObj }),
      Patient.countDocuments({
        tenantId: tenantObj,
        createdAt: { $gte: startOfMonth },
      }),
    ]).then(([total, newThisMonth]) => ({ total, newThisMonth })),
    isDoctor
      ? 0
      : Invoice.countDocuments({
          tenantId: tenantObj,
          status: { $in: ['pending', 'partial'] },
          deletedAt: null,
        }),
    Appointment.find(apptMatchToday).limit(10).sort({ startTime: 1 }).lean(),
    Patient.find({ tenantId: tenantObj }).sort({ createdAt: -1 }).limit(5).lean(),
    isDoctor
      ? []
      : Invoice.find({
          tenantId: tenantObj,
          status: { $in: ['pending', 'partial'] },
          dueDate: { $lt: todayStart },
          deletedAt: null,
        })
          .limit(5)
          .sort({ dueDate: 1 })
          .lean(),
    InventoryItem.find({
      tenantId: tenantObj,
      deletedAt: null,
      $expr: { $lte: ['$availableQuantity', '$reorderPoint'] },
    })
      .limit(5)
      .lean(),
    Queue.find({
      tenantId: tenantObj,
      status: { $in: ['waiting', 'in_progress'] },
      deletedAt: null,
    })
      .limit(100)
      .lean(),
    InventoryItem.aggregate([
      { $match: { tenantId: tenantObj, deletedAt: null, 'batches.0': { $exists: true } } },
      { $unwind: '$batches' },
      {
        $match: {
          'batches.expiryDate': { $gte: now, $lte: thirtyDaysFromNow },
        },
      },
      { $limit: 5 },
      {
        $project: {
          batchNumber: '$batches.batchNumber',
          expiryDate: '$batches.expiryDate',
          quantity: '$batches.quantity',
          itemName: '$name',
        },
      },
    ]),
    Appointment.find({
      ...apptMatch,
      status: { $in: ['scheduled', 'pending'] },
    })
      .limit(5)
      .sort({ createdAt: -1 })
      .lean(),
    isDoctor
      ? []
      : Invoice.aggregate([
          {
            $match: {
              tenantId: tenantObj,
              status: 'paid',
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              value: { $sum: '$total' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
    Appointment.aggregate([
      { $match: { tenantId: tenantObj, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Patient.aggregate([
      { $match: { tenantId: tenantObj, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    trendsPromise,
    isDoctor
      ? Promise.resolve(0)
      : ClinicDashboardMetrics.findOne({ tenantId: tenantObj })
          .select('failed_transactions')
          .lean()
          .then((d) => d?.failed_transactions ?? 0),
  ]);

  const [todayCount, completedToday, pendingCount] = val(statsResult, [0, 0, 0]);
  const revenue = val(revenueResult, { todayPaid: 0, monthTotal: 0 });
  const patientCounts = val(patientCountsResult, { total: 0, newThisMonth: 0 });
  const pendingInvoicesCount = val(pendingInvoicesCountResult, 0);
  const queue = val(queueItems, []);
  const overdueInvoicesList = val(overdueInvoices, []);
  const lowStockList = val(lowStock, []);
  const expiringLotsList = val(expiringLots, []);

  const criticalAlerts = [];
  if (overdueInvoicesList.length > 0) {
    criticalAlerts.push({
      type: 'invoice',
      severity: 'warning',
      message: `${overdueInvoicesList.length} overdue invoice(s) require attention`,
      count: overdueInvoicesList.length,
    });
  }
  if (lowStockList.length > 0) {
    criticalAlerts.push({
      type: 'inventory',
      severity: 'error',
      message: `${lowStockList.length} item(s) running low on stock`,
      count: lowStockList.length,
    });
  }
  if (expiringLotsList.length > 0) {
    criticalAlerts.push({
      type: 'lot',
      severity: 'warning',
      message: `${expiringLotsList.length} lot(s) expiring soon`,
      count: expiringLotsList.length,
    });
  }

  const queueActive = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'in_progress',
  ).length;
  const queueWaiting = queue.filter((q) => q.status === 'waiting').length;

  return {
    stats: {
      todayAppointments: todayCount ?? 0,
      completedToday: completedToday ?? 0,
      pendingAppointments: pendingCount ?? 0,
      queueActive,
      queueWaiting,
      queue: {
        waiting: queueWaiting,
        inProgress: queue.filter((q) => q.status === 'in_progress').length,
      },
      todayRevenue: revenue.todayPaid ?? 0,
      monthRevenue: revenue.monthTotal ?? 0,
      totalPatients: patientCounts.total ?? 0,
      activePatients: patientCounts.total ?? 0,
      newPatientsThisMonth: patientCounts.newThisMonth ?? 0,
      pendingInvoices: pendingInvoicesCount ?? 0,
      lastUpdated: now.toISOString(),
      failed_transactions: isDoctor ? 0 : (val(failedTxResult, 0) ?? 0),
      revenue: {
        today: { total: revenue.todayPaid, paid: revenue.todayPaid },
        thisMonth: { total: revenue.monthTotal },
      },
      patients: { total: patientCounts.total ?? 0, active: patientCounts.total ?? 0 },
      appointments: {
        todayTotal: todayCount ?? 0,
        today: { completed: completedToday ?? 0 },
        thisMonth: 0,
        total: 0,
        upcoming: pendingCount ?? 0,
      },
    },
    lists: {
      todayAppointments: val(todayAppointments, []),
      recentPatients: val(recentPatients, []),
      overdueInvoices: overdueInvoicesList,
      lowStockItems: lowStockList,
      queueStatus: {
        active: queue.filter((q) => q.status === 'waiting' || q.status === 'in_progress').length,
        waiting: queue.filter((q) => q.status === 'waiting').length,
        inProgress: queue.filter((q) => q.status === 'in_progress').length,
      },
      expiringLots: expiringLotsList,
      appointmentRequests: val(pendingRequests, []),
      criticalAlerts,
    },
    charts: {
      revenue: val(chartRevenue, []),
      appointments: val(chartAppointments, []),
      patients: val(chartPatients, []),
    },
    trends: val(trendsResult, { revenue: null, patientFlow: null }),
    meta: {
      fetchedAt: now.toISOString(),
      role,
    },
  };
}

async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { success: false, message: 'Tenant context required' },
      { status: 400 },
    );
  }

  try {
    const data = await getDashboardAll(tenantId, user.userId || user.id, user.role ?? '');
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    logger.error('Dashboard all endpoint error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load dashboard' } },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
