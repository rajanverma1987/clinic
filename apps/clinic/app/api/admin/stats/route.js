import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import InventoryItem from '@/models/InventoryItem';
import Invoice from '@/models/Invoice';
import Patient from '@/models/Patient';
import Payment from '@/models/Payment';
import Prescription from '@/models/Prescription';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/stats
 * Get comprehensive system-wide statistics (Super Admin only)
 */
async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deletedNull = { deletedAt: null };
  const notSuperAdmin = { role: { $ne: 'super_admin' } };

  // Run all independent queries in parallel (no full collection scans)
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    activeUsers,
    superAdmins,
    usersByRoleResult,
    totalSubscriptions,
    activeSubscriptions,
    cancelledSubscriptions,
    expiredSubscriptions,
    totalPlans,
    activePlans,
    totalDoctors,
    verifiedDoctors,
    pendingDoctors,
    totalPatients,
    activePatients,
    patientsThisMonth,
    totalAppointments,
    appointmentsToday,
    appointmentsThisMonth,
    totalInvoices,
    pendingInvoices,
    paidInvoices,
    revenueResult,
    thisMonthRevenueResult,
    todayRevenueResult,
    thisYearRevenueResult,
    suspendedSubscriptions,
    expiringSubscriptionsCount,
    renewalAlertsCount,
    totalPayments,
    paymentsThisMonth,
    totalPaymentsAmountResult,
    totalPrescriptions,
    activePrescriptions,
    pendingPrescriptions,
    totalInventoryItems,
    activeInventoryItems,
    lowStockItems,
    activeSubs,
    recentTenants,
    recentUsers,
    recentPatients,
    tenantsByRegion,
    subscriptionsByStatus,
    paymentDelaysCount,
    storageCounts,
    subscriptionsInTrial,
  ] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ isActive: true }),
    User.countDocuments(notSuperAdmin),
    User.countDocuments({ ...notSuperAdmin, isActive: true }),
    User.countDocuments({ role: 'super_admin' }),
    User.aggregate([{ $match: notSuperAdmin }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
    Subscription.countDocuments(),
    Subscription.countDocuments({ status: 'ACTIVE' }),
    Subscription.countDocuments({ status: 'CANCELLED' }),
    Subscription.countDocuments({ status: 'EXPIRED' }),
    SubscriptionPlan.countDocuments(),
    SubscriptionPlan.countDocuments({ status: 'ACTIVE' }),
    Doctor.countDocuments({}),
    Doctor.countDocuments({ verificationStatus: 'verified' }),
    Doctor.countDocuments({ verificationStatus: 'pending' }),
    Patient.countDocuments(deletedNull),
    Patient.countDocuments({ ...deletedNull, isActive: true }),
    Patient.countDocuments({ ...deletedNull, createdAt: { $gte: monthStart } }),
    Appointment.countDocuments(deletedNull),
    Appointment.countDocuments({
      ...deletedNull,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    }),
    Appointment.countDocuments({
      ...deletedNull,
      appointmentDate: { $gte: monthStart },
    }),
    Invoice.countDocuments(deletedNull),
    Invoice.countDocuments({ ...deletedNull, status: { $in: ['PENDING', 'PARTIAL'] } }),
    Invoice.countDocuments({ ...deletedNull, status: 'PAID' }),
    Invoice.aggregate([
      { $match: deletedNull },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $match: { ...deletedNull, invoiceDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          ...deletedNull,
          invoiceDate: { $gte: todayStart, $lte: todayEnd },
          status: 'PAID',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $match: { ...deletedNull, invoiceDate: { $gte: yearStart }, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Subscription.countDocuments({ status: 'SUSPENDED' }),
    Subscription.countDocuments({
      status: 'ACTIVE',
      $or: [
        { nextBillingDate: { $gte: now, $lte: sevenDaysFromNow } },
        { currentPeriodEnd: { $gte: now, $lte: sevenDaysFromNow } },
      ],
    }),
    Subscription.countDocuments({
      status: 'ACTIVE',
      cancelAtPeriodEnd: true,
    }),
    Payment.countDocuments(),
    Payment.countDocuments({ createdAt: { $gte: monthStart } }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Prescription.countDocuments(deletedNull),
    Prescription.countDocuments({ ...deletedNull, status: 'ACTIVE' }),
    Prescription.countDocuments({ ...deletedNull, status: 'PENDING' }),
    InventoryItem.countDocuments(deletedNull),
    InventoryItem.countDocuments({ ...deletedNull, isActive: true }),
    InventoryItem.countDocuments({
      ...deletedNull,
      isActive: true,
      $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
    }),
    Subscription.find({ status: 'ACTIVE' }).populate('planId', 'price billingCycle').lean(),
    Tenant.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ ...notSuperAdmin, createdAt: { $gte: sevenDaysAgo } }),
    Patient.countDocuments({ ...deletedNull, createdAt: { $gte: sevenDaysAgo } }),
    Tenant.aggregate([{ $group: { _id: '$region', count: { $sum: 1 } } }]),
    Subscription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Subscription.countDocuments({
      status: 'ACTIVE',
      nextBillingDate: { $lt: now },
    }),
    Subscription.countDocuments({
      status: 'ACTIVE',
      trialEnd: { $gte: now },
    }),
    Promise.all([
      Patient.countDocuments(deletedNull),
      Appointment.countDocuments(deletedNull),
      Prescription.countDocuments(deletedNull),
      Invoice.countDocuments(deletedNull),
      User.countDocuments(notSuperAdmin),
    ]).then(([p, a, pr, i, u]) => ({
      patients: p,
      appointments: a,
      prescriptions: pr,
      invoices: i,
      users: u,
      totalDocs: (p || 0) + (a || 0) + (pr || 0) + (i || 0) + (u || 0),
    })),
  ]);

  const [trialEndingSoonList, paymentFailuresList, inactive30dList, suspendedList] =
    await Promise.all([
      Subscription.find({
        status: 'ACTIVE',
        trialEnd: { $gte: now, $lte: sevenDaysFromNow },
      })
        .populate('tenantId', 'name slug')
        .lean(),
      Subscription.find({ status: 'ACTIVE', nextBillingDate: { $lt: now } })
        .populate('tenantId', 'name slug')
        .lean(),
      Tenant.find({ isActive: false, updatedAt: { $lt: thirtyDaysAgo } })
        .select('_id name slug')
        .lean(),
      Subscription.find({ status: 'SUSPENDED' }).populate('tenantId', 'name slug').lean(),
    ]);

  const toClinicItem = (t) => {
    if (!t) return null;
    const id = t._id?.toString?.();
    const name = t.name || '';
    const slug = t.slug || '';
    return id ? { tenantId: id, name, slug } : null;
  };
  const fromSub = (s) => {
    const t = s.tenantId;
    if (!t) return null;
    return toClinicItem({ _id: t._id, name: t.name, slug: t.slug });
  };
  const platformAlerts = {
    trialEndingSoon: {
      count: trialEndingSoonList.length,
      items: trialEndingSoonList.map(fromSub).filter(Boolean),
    },
    paymentFailures: {
      count: paymentFailuresList.length,
      items: paymentFailuresList.map(fromSub).filter(Boolean),
    },
    storageNearingLimit: { count: 0, items: [] },
    inactiveClinics30d: {
      count: inactive30dList.length,
      items: inactive30dList.map(toClinicItem).filter(Boolean),
    },
    suspendedClinics: {
      count: suspendedList.length,
      items: suspendedList.map(fromSub).filter(Boolean),
    },
  };

  const totalRevenue = revenueResult[0]?.total ?? 0;
  const thisMonthRevenue = thisMonthRevenueResult[0]?.total ?? 0;
  const todayRevenue = todayRevenueResult[0]?.total ?? 0;
  const thisYearRevenue = thisYearRevenueResult[0]?.total ?? 0;
  const totalPaymentsValue = totalPaymentsAmountResult[0]?.total ?? 0;
  const inactiveTenants = Math.max(0, (Number(totalTenants) || 0) - (Number(activeTenants) || 0));
  const paymentDelays = paymentDelaysCount ?? 0;
  const storage = storageCounts ?? {
    patients: 0,
    appointments: 0,
    prescriptions: 0,
    invoices: 0,
    users: 0,
    totalDocs: 0,
  };

  let mrr = 0;
  activeSubs.forEach((sub) => {
    if (sub.planId?.price) {
      if (sub.planId.billingCycle === 'monthly') {
        mrr += sub.planId.price;
      } else if (sub.planId.billingCycle === 'yearly') {
        mrr += sub.planId.price / 12;
      }
    }
  });

  return NextResponse.json(
    successResponse({
      // Tenants (suspended = tenants with suspended subscription)
      tenants: {
        total: Number(totalTenants) || 0,
        active: Number(activeTenants) || 0,
        inactive: inactiveTenants,
        suspended: Number(suspendedSubscriptions) || 0,
        recent: recentTenants,
        byRegion: tenantsByRegion,
      },
      // Users (tenant-level: total across clinics)
      users: {
        total: Number(totalUsers) || 0,
        active: activeUsers,
        superAdmins: superAdmins,
        recent: recentUsers,
        byRole: usersByRoleResult,
      },
      // Subscriptions
      subscriptions: {
        total: Number(totalSubscriptions) || 0,
        active: Number(activeSubscriptions) || 0,
        cancelled: Number(cancelledSubscriptions) || 0,
        expired: Number(expiredSubscriptions) || 0,
        inTrial: Number(subscriptionsInTrial) || 0,
        suspended: Number(suspendedSubscriptions) || 0,
        expiringIn7Days: Number(expiringSubscriptionsCount) || 0,
        renewalAlerts: Number(renewalAlertsCount) || 0,
        mrr: Number(mrr) || 0,
        byStatus: subscriptionsByStatus,
      },
      // Subscription Plans
      plans: {
        total: totalPlans,
        active: activePlans,
      },
      // Doctors (Phase 5.1 platform KPIs)
      doctors: {
        total: totalDoctors,
        verified: verifiedDoctors,
        pending: pendingDoctors,
      },
      // Commission (placeholder; can be computed from billing later)
      commission: 0,
      // Patients
      patients: {
        total: totalPatients,
        active: activePatients,
        thisMonth: patientsThisMonth,
        recent: recentPatients,
      },
      // Appointments
      appointments: {
        total: totalAppointments,
        today: appointmentsToday,
        thisMonth: appointmentsThisMonth,
      },
      // Invoices
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
        paid: paidInvoices,
      },
      // Revenue
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisMonth: thisMonthRevenue,
        thisYear: thisYearRevenue,
        mrr: mrr,
      },
      // Payments
      payments: {
        total: totalPayments,
        thisMonth: paymentsThisMonth,
        totalAmount: totalPaymentsValue,
      },
      // Prescriptions
      prescriptions: {
        total: totalPrescriptions,
        active: activePrescriptions,
        pending: pendingPrescriptions,
      },
      // Inventory
      inventory: {
        total: totalInventoryItems,
        active: activeInventoryItems,
        lowStock: lowStockItems,
      },
      // Risk monitoring (Super_Admin.md L68-72) + paymentDelays for Subscription & Billing
      riskMonitoring: {
        expiringSubscriptions: Number(expiringSubscriptionsCount) || 0,
        securityAlerts: 0,
        suspendedClinics: Number(suspendedSubscriptions) || 0,
        auditAnomalies: 0,
        paymentDelays: Number(paymentDelays) || 0,
      },
      // Platform Alerts (each alert links to clinic)
      platformAlerts,
      // Storage / usage (SA4)
      storage: {
        ...storage,
        totalDocs: Number(storage?.totalDocs) || 0,
      },
      // System health (Super_Admin.md: HEALTHY / DEGRADED / CRITICAL)
      systemHealth: {
        status: 'healthy',
        message: 'All systems operational',
      },
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
