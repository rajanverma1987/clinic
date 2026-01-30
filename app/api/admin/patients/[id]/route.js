/**
 * Admin Patient by ID API
 * Get, update, or delete a single patient (Super Admin only).
 *
 * @module app/api/admin/patients/[id]/route
 * GET /api/admin/patients/:id - Patient details, appointment history, payment summary
 * PUT /api/admin/patients/:id - Update status (suspend/activate)
 * DELETE /api/admin/patients/:id - Soft delete
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/Invoice';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/admin/patients/:id
 */
async function getHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }
    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await Patient.findOne({ _id: id, deletedAt: null })
      .populate('tenantId', 'name slug')
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const [appointments, invoices] = await Promise.all([
      Appointment.find({ patientId: id })
        .sort({ appointmentDate: -1 })
        .limit(50)
        .populate('doctorId', 'firstName lastName email')
        .lean(),
      Invoice.find({ patientId: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const paymentTotal = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidTotal = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    const data = {
      patient: {
        _id: patient._id.toString(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        status: patient.status || 'active',
        patientId: patient.patientId,
        tenantId: patient.tenantId?._id?.toString(),
        tenantName: patient.tenantId?.name,
        address: patient.address,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
      appointments: appointments.map((a) => ({
        _id: a._id.toString(),
        appointmentNumber: a.appointmentNumber,
        appointmentDate: a.appointmentDate,
        status: a.status,
        type: a.type,
        doctorName: a.doctorId ? `${a.doctorId.firstName || ''} ${a.doctorId.lastName || ''}`.trim() : '—',
        createdAt: a.createdAt,
      })),
      invoices: invoices.map((inv) => ({
        _id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        status: inv.status,
        createdAt: inv.createdAt,
      })),
      paymentSummary: { total: paymentTotal, paid: paidTotal, outstanding: paymentTotal - paidTotal },
    };

    return NextResponse.json(successResponse(data));
  } catch (err) {
    logger.error('Admin patient get error:', err);
    return NextResponse.json(
      errorResponse(
        err instanceof Error ? err.message : 'Failed to fetch patient',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/patients/:id - update status (suspend/activate)
 */
async function putHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }
    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const update = { updatedAt: new Date() };
    if (body.status !== undefined) {
      update.status = body.status === 'inactive' ? 'inactive' : 'active';
    }
    if (body.flagged !== undefined) {
      const flagged = body.flagged === true || body.flagged === 'true';
      const flagReason = typeof body.flagReason === 'string' ? body.flagReason.trim() : '';
      update.flagged = !!flagged;
      update.flaggedAt = flagged ? new Date() : null;
      update.flaggedBy = flagged ? (user._id || user.id) : null;
      update.flagReason = flagged ? (flagReason || 'Flagged by admin') : '';
    }

    await connectDB();

    const patient = await Patient.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: update },
      { new: true }
    ).lean();

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        _id: patient._id.toString(),
        status: patient.status,
      })
    );
  } catch (err) {
    logger.error('Admin patient update error:', err);
    return NextResponse.json(
      errorResponse(
        err instanceof Error ? err.message : 'Failed to update patient',
        'UPDATE_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/patients/:id - soft delete
 */
async function deleteHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }
    if (!id) {
      return NextResponse.json(
        errorResponse('Patient ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();

    const patient = await Patient.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), status: 'inactive', updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ _id: patient._id.toString(), deleted: true })
    );
  } catch (err) {
    logger.error('Admin patient delete error:', err);
    return NextResponse.json(
      errorResponse(
        err instanceof Error ? err.message : 'Failed to delete patient',
        'DELETE_ERROR'
      ),
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return getHandler(authenticatedReq, authResult.user, params.id);
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return putHandler(authenticatedReq, authResult.user, params.id);
}

export async function DELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return deleteHandler(authenticatedReq, authResult.user, params.id);
}
