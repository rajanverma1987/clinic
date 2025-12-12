import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
import Prescription from '@/models/Prescription';
import InventoryItem from '@/models/InventoryItem';

/**
 * GET /api/admin/stats
 * Get comprehensive system-wide statistics (Super Admin only)
 */
async function getHandler(req, user) {
  try {
    // Check if user is super admin
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    await connectDB();

    // Get all tenants
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ isActive: true });
    const inactiveTenants = totalTenants - activeTenants;

    // Get all users (excluding super admins for tenant-specific counts)
    const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });
    const activeUsers = await User.countDocuments({ 
      role: { $ne: 'super_admin' },
      isActive: true 
    });
    const superAdmins = await User.countDocuments({ role: 'super_admin' });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { role: { $ne: 'super_admin' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Get all subscriptions
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'ACTIVE' });
    const cancelledSubscriptions = await Subscription.countDocuments({ status: 'CANCELLED' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'EXPIRED' });

    // Get subscription plans
    const totalPlans = await SubscriptionPlan.countDocuments();
    const activePlans = await SubscriptionPlan.countDocuments({ status: 'ACTIVE' });

    // Get all patients across all tenants
    const totalPatients = await Patient.countDocuments({ deletedAt: null });
    const patientsThisMonth = await Patient.countDocuments({
      deletedAt: null,
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    });

    // Get all appointments
    const totalAppointments = await Appointment.countDocuments({ deletedAt: null });
    const appointmentsToday = await Appointment.countDocuments({
      deletedAt: null,
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });
    const appointmentsThisMonth = await Appointment.countDocuments({
      deletedAt: null,
      appointmentDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    // Get all invoices
    const totalInvoices = await Invoice.countDocuments({ deletedAt: null });
    const pendingInvoices = await Invoice.countDocuments({
      deletedAt: null,
      status: { $in: ['PENDING', 'PARTIAL'] },
    });
    const paidInvoices = await Invoice.countDocuments({
      deletedAt: null,
      status: 'PAID',
    });

    // Calculate total revenue
    const allInvoices = await Invoice.find({ deletedAt: null }).lean();
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    const thisMonthInvoices = await Invoice.find({
      deletedAt: null,
      invoiceDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }).lean();
    const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    // Get all payments
    const totalPayments = await Payment.countDocuments();
    const paymentsThisMonth = await Payment.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    });
    const totalPaymentsAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPaymentsValue = totalPaymentsAmount[0]?.total || 0;

    // Get all prescriptions
    const totalPrescriptions = await Prescription.countDocuments({ deletedAt: null });
    const activePrescriptions = await Prescription.countDocuments({
      deletedAt: null,
      status: 'ACTIVE',
    });
    const pendingPrescriptions = await Prescription.countDocuments({
      deletedAt: null,
      status: 'PENDING',
    });

    // Get inventory stats
    const totalInventoryItems = await InventoryItem.countDocuments({ deletedAt: null });
    const activeInventoryItems = await InventoryItem.countDocuments({
      deletedAt: null,
      isActive: true,
    });
    const lowStockItems = await InventoryItem.countDocuments({
      deletedAt: null,
      isActive: true,
      $expr: { $lte: ['$totalQuantity', '$lowStockThreshold'] },
    });

    // Get subscription revenue (MRR - Monthly Recurring Revenue)
    const activeSubs = await Subscription.find({ status: 'ACTIVE' })
      .populate('planId', 'price billingCycle')
      .lean();
    
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

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTenants = await Tenant.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const recentUsers = await User.countDocuments({
      role: { $ne: 'super_admin' },
      createdAt: { $gte: sevenDaysAgo },
    });
    const recentPatients = await Patient.countDocuments({
      deletedAt: null,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get tenants by region
    const tenantsByRegion = await Tenant.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
    ]);

    // Get subscription status breakdown
    const subscriptionsByStatus = await Subscription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

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
          byRole: usersByRole,
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
        // Patients
        patients: {
          total: totalPatients,
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
      })
    );
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to fetch admin stats',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);

