/**
 * Admin Doctor Request Documents API
 * POST /api/admin/doctors/:id/request-documents
 * Body: { documentType: string, comment?: string }
 * Sends email to doctor asking for additional documents (dp-6).
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { sendDoctorDocumentRequestEmail } from '@/lib/email/email-service.js';
import { logger } from '@/lib/utils/logger.js';

async function postHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }
    if (!id) {
      return NextResponse.json(
        errorResponse('Doctor ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const documentType = typeof body.documentType === 'string' ? body.documentType.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!documentType) {
      return NextResponse.json(
        errorResponse('documentType is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const doctor = await Doctor.findById(id).populate('userId', 'firstName lastName email').lean();
    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const doctorUser = doctor.userId;
    const doctorEmail = doctorUser?.email;
    const doctorName = doctorUser
      ? [doctorUser.firstName, doctorUser.lastName].filter(Boolean).join(' ') || 'Doctor'
      : 'Doctor';
    const tenantId = doctor.tenantId?.toString() || null;

    if (doctorEmail) {
      await sendDoctorDocumentRequestEmail(
        doctorEmail,
        doctorName,
        documentType,
        comment,
        tenantId
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Document request sent to doctor.' })
    );
  } catch (err) {
    logger.error('Admin doctor request-documents error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Request failed', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user, params.id);
}
