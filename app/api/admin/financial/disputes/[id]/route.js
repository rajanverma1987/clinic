/**
 * Admin Payment Dispute by ID (Super Admin only)
 * GET /api/admin/financial/disputes/:id
 * PUT /api/admin/financial/disputes/:id - body: { status?, adminNotes?, issueRefund?: boolean }
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import PaymentDispute from '@/models/PaymentDispute';
import { processRefund } from '@/services/billing.service';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    if (!id) {
      return NextResponse.json(errorResponse('Dispute ID required', 'VALIDATION_ERROR'), { status: 400 });
    }
    await connectDB();
    const dispute = await PaymentDispute.findOne({ _id: id, deletedAt: null })
      .populate('patientId', 'firstName lastName email phone patientId')
      .populate('tenantId', 'name slug')
      .populate('invoiceId', 'invoiceNumber totalAmount status')
      .populate('paymentId', 'paymentNumber amount status')
      .lean();
    if (!dispute) {
      return NextResponse.json(errorResponse('Dispute not found', 'NOT_FOUND'), { status: 404 });
    }
    const data = {
      _id: dispute._id.toString(),
      tenantId: dispute.tenantId?._id?.toString(),
      tenantName: dispute.tenantId?.name,
      invoiceId: dispute.invoiceId?._id?.toString(),
      invoiceNumber: dispute.invoiceId?.invoiceNumber,
      paymentId: dispute.paymentId?._id?.toString(),
      paymentNumber: dispute.paymentId?.paymentNumber,
      patientId: dispute.patientId?._id?.toString(),
      patientName: dispute.patientId ? `${dispute.patientId.firstName || ''} ${dispute.patientId.lastName || ''}`.trim() : null,
      patientEmail: dispute.patientId?.email,
      patientPhone: dispute.patientId?.phone,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      evidence: dispute.evidence,
      status: dispute.status,
      adminNotes: dispute.adminNotes,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt,
    };
    return NextResponse.json(successResponse(data));
  } catch (err) {
    logger.error('Admin dispute get error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch dispute', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

async function putHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    if (!id) {
      return NextResponse.json(errorResponse('Dispute ID required', 'VALIDATION_ERROR'), { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const status = body.status;
    const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : undefined;
    const issueRefund = body.issueRefund === true;

    await connectDB();
    const dispute = await PaymentDispute.findOne({ _id: id, deletedAt: null }).lean();
    if (!dispute) {
      return NextResponse.json(errorResponse('Dispute not found', 'NOT_FOUND'), { status: 404 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (issueRefund && dispute.paymentId) {
      try {
        await processRefund(
          dispute.paymentId.toString(),
          dispute.amount,
          dispute.reason || 'Refund via dispute resolution',
          dispute.tenantId.toString(),
          user._id?.toString() || user.id
        );
      } catch (refundErr) {
        logger.error('Dispute refund error:', refundErr);
        return NextResponse.json(
          errorResponse(refundErr instanceof Error ? refundErr.message : 'Refund failed', 'REFUND_ERROR'),
          { status: 400 }
        );
      }
    }

    const update = { updatedAt: new Date() };
    if (status && ['contacted', 'escalated', 'resolved', 'refund_issued'].includes(status)) {
      update.status = status;
      if (status === 'resolved' || status === 'refund_issued') {
        update.resolvedAt = new Date();
        update.resolvedBy = user._id || user.id;
      }
    }
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (issueRefund && dispute.paymentId) update.status = 'refund_issued';
    if (issueRefund && dispute.paymentId) {
      update.resolvedAt = new Date();
      update.resolvedBy = user._id || user.id;
    }

    const updated = await PaymentDispute.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return NextResponse.json(successResponse({
      _id: updated._id.toString(),
      status: updated.status,
      resolvedAt: updated.resolvedAt,
    }));
  } catch (err) {
    logger.error('Admin dispute update error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to update dispute', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return putHandler(req, authResult.user, params.id);
}
