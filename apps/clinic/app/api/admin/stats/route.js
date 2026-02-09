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
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total ?? 0;
    const totalPaymentsValue = totalPaymentsAmountResult[0]?.total ?? 0;
    const inactiveTenants = totalTenants - activeTenants;

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
        // Tenants
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: inactiveTenants,
          recent: recentTenants,
          byRegion: tenantsByRegion,
        },
        // Users
        users: {
          total: totalUsers,
          active: activeUsers,
          superAdmins: superAdmins,
          recent: recentUsers,
          byRole: usersByRoleResult,
        },
        // Subscriptions
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions,
          expired: expiredSubscriptions,
          mrr: mrr,
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
          thisMonth: thisMonthRevenue,
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
