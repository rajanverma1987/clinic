/**
 * Admin Payment Disputes API (Super Admin only)
 * GET /api/admin/financial/disputes?status=&page=&limit=
 * POST /api/admin/financial/disputes - body: { tenantId, patientId, invoiceId?, paymentId?, amount, reason, evidence? }
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import PaymentDispute from '@/models/PaymentDispute';
import { logger } from '@/lib/utils/logger.js';

async function postHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const { tenantId, patientId, invoiceId, paymentId, amount, reason, evidence } = body;
    if (!tenantId || !patientId || amount == null || !reason) {
      return NextResponse.json(
        errorResponse('tenantId, patientId, amount, and reason are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    await connectDB();
    const dispute = await PaymentDispute.create({
      tenantId,
      patientId,
      invoiceId: invoiceId || undefined,
      paymentId: paymentId || undefined,
      amount: Number(amount) || 0,
      currency: body.currency || 'USD',
      reason: String(reason).trim(),
      evidence: evidence ? String(evidence).trim() : undefined,
      status: 'open',
      createdBy: user._id || user.id,
    });
    const data = {
      _id: dispute._id.toString(),
      status: dispute.status,
      createdAt: dispute.createdAt,
    };
    return NextResponse.json(successResponse(data), { status: 201 });
  } catch (err) {
    logger.error('Admin dispute create error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to create dispute', 'CREATE_ERROR'),
      { status: 500 }
    );
  }
}

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const query = { deletedAt: null };
    if (status && ['open', 'contacted', 'escalated', 'resolved', 'refund_issued'].includes(status)) {
      query.status = status;
    }

    const total = await PaymentDispute.countDocuments(query);
    const skip = (page - 1) * limit;
    const disputes = await PaymentDispute.find(query)
      .populate('patientId', 'firstName lastName email phone patientId')
      .populate('tenantId', 'name slug')
      .populate('invoiceId', 'invoiceNumber totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = disputes.map((d) => ({
      _id: d._id.toString(),
      tenantId: d.tenantId?._id?.toString(),
      tenantName: d.tenantId?.name,
      invoiceId: d.invoiceId?._id?.toString(),
      invoiceNumber: d.invoiceId?.invoiceNumber,
      paymentId: d.paymentId?.toString(),
      patientId: d.patientId?._id?.toString(),
      patientName: d.patientId ? `${d.patientId.firstName || ''} ${d.patientId.lastName || ''}`.trim() : null,
      patientEmail: d.patientId?.email,
      amount: d.amount,
      currency: d.currency,
      reason: d.reason,
      evidence: d.evidence,
      status: d.status,
      adminNotes: d.adminNotes,
      createdAt: d.createdAt,
      resolvedAt: d.resolvedAt,
    }));

    return NextResponse.json(
      successResponse({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      })
    );
  } catch (err) {
    logger.error('Admin disputes list error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch disputes', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
