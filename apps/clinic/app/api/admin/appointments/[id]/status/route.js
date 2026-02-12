/**
 * Admin Appointment Status - Cancel/Update (Super Admin only)
 * @module app/api/admin/appointments/[id]/status/route
 * PUT /api/admin/appointments/:id/status - Body: { status: string, cancellationReason?: string }
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Appointment from '@/models/Appointment';
import { logger } from '@/lib/utils/logger.js';

async function putHandler(req, user, id) {
  try {
    if (user.role === 'super_admin') {
      return NextResponse.json(
        errorResponse('Access denied. Platform role has no tenant operational data access.', 'DATA_PRIVACY'),
        { status: 403 }
      );
    }
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    if (!id) {
      return NextResponse.json(errorResponse('Appointment ID required', 'VALIDATION_ERROR'), { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const status = body.status;
    const cancellationReason = body.cancellationReason || 'Cancelled by admin';
    if (!status) {
      return NextResponse.json(errorResponse('Provide status', 'VALIDATION_ERROR'), { status: 400 });
    }
    await connectDB();
    const update = status === 'cancelled' || status === 'completed'
      ? { status, updatedAt: new Date(), ...(status === 'cancelled' ? { cancelledAt: new Date(), cancellationReason } : status === 'completed' ? { completedAt: new Date() } : {}) }
      : { status, updatedAt: new Date() };
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: update },
      { new: true }
    ).lean();
    if (!appointment) {
      return NextResponse.json(errorResponse('Appointment not found', 'NOT_FOUND'), { status: 404 });
    }
    return NextResponse.json(successResponse({ id: appointment._id.toString(), status: appointment.status }));
  } catch (err) {
    logger.error('Admin appointment status error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to update status', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return putHandler(authenticatedReq, authResult.user, params.id);
}
