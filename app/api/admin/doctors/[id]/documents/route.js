/**
 * Admin Doctor Documents API
 * GET /api/admin/doctors/:id/documents
 * Returns doctor.uploadedDocuments or [] (Super Admin only).
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import { logger } from '@/lib/utils/logger.js';

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
        errorResponse('Doctor ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const doctor = await Doctor.findById(id).select('uploadedDocuments').lean();
    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const documents = Array.isArray(doctor.uploadedDocuments) ? doctor.uploadedDocuments : [];
    return NextResponse.json(successResponse(documents));
  } catch (err) {
    logger.error('Admin doctor documents error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch documents', 'FETCH_ERROR'),
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
