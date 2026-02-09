/**
 * Admin Financial Revenue API (Super Admin only)
 * GET /api/admin/financial/revenue?startDate=&endDate=
 * Returns: overview (total, collected, pending, refunded), breakdown by type, revenueTrend, topDoctors
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
import Doctor from '@/models/Doctor';
import Invoice from '@/models/Invoice';
import { NextResponse } from 'next/server';

function getMonthKeys(lastN = 12) {
  const keys = [];
  const now = new Date();
  for (let i = lastN - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }
  return keys;
}

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter = {};
    if (startDateParam) dateFilter.$gte = new Date(startDateParam);
    if (endDateParam) dateFilter.$lte = new Date(endDateParam + 'T23:59:59.999Z');
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const invoiceDateQuery = { deletedAt: null };
    if (hasDateFilter) invoiceDateQuery.invoiceDate = dateFilter;

    // Overview: total (invoiced), collected (paid), pending, refunded
    const invoices = await Invoice.find(invoiceDateQuery).lean();
    let total = 0;
    let collected = 0;
    let pending = 0;
    let refunded = 0;
    const breakdown = { consultation: 0, lab_test: 0, medication: 0, procedure: 0, other: 0 };

    invoices.forEach((inv) => {
      const amt = inv.totalAmount || 0;
      total += amt;
      if (inv.status === 'paid' || inv.status === 'partial') collected += amt;
      else if (inv.status === 'pending' || inv.status === 'draft') pending += amt;
      else if (inv.status === 'refunded') refunded += amt;

      (inv.items || []).forEach((item) => {
        const t = (item.type || 'other').toLowerCase();
        const key = breakdown[t] !== undefined ? t : 'other';
        breakdown[key] = (breakdown[key] || 0) + (item.totalWithTax ?? item.total ?? 0);
      });
    });

    // Revenue trend (last 12 months)
    const months = getMonthKeys(12);
    const revenueTrend = await Promise.all(
      months.map(async (m) => {
        const list = await Invoice.find({
          deletedAt: null,
          invoiceDate: { $gte: m.start, $lte: m.end },
          status: { $in: ['paid', 'partial'] },
        }).lean();
        const value = list.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        return { label: m.label, value: Math.round(value * 100) / 100, key: m.key };
      }),
    );

    // Top earning doctors (via appointments linked to invoices)
    const appointmentIds = [
      ...new Set(invoices.map((i) => i.appointmentId?.toString()).filter(Boolean)),
    ];
    const appointments = await Appointment.find({ _id: { $in: appointmentIds } })
      .select('doctorId')
      .lean();
    const doctorAmounts = {};
    invoices.forEach((inv) => {
      const aptId = inv.appointmentId?.toString();
      if (!aptId) return;
      const apt = appointments.find((a) => a._id.toString() === aptId);
      const doctorId = apt?.doctorId?.toString();
      if (!doctorId) return;
      doctorAmounts[doctorId] = (doctorAmounts[doctorId] || 0) + (inv.totalAmount || 0);
    });
    const doctorIds = Object.keys(doctorAmounts);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .populate('userId', 'firstName lastName email')
      .lean();
    const topDoctors = doctorIds
      .map((id) => {
        const doc = doctors.find((d) => d._id.toString() === id);
        const amount = doctorAmounts[id] || 0;
        return {
          doctorId: id,
          doctorName: doc?.userId
            ? `${doc.userId.firstName || ''} ${doc.userId.lastName || ''}`.trim() ||
              doc.userId.email
            : id,
          amount: Math.round(amount * 100) / 100,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return NextResponse.json(
      successResponse({
        overview: { total, collected, pending, refunded },
        breakdown,
        revenueTrend,
        topDoctors,
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
 * 5. Permission check - Validates REPORT:READ permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
  ),
);
