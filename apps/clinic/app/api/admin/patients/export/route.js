/**
 * Admin Patients Export API
 * Export selected patients as CSV (Super Admin only).
 *
 * @module app/api/admin/patients/export/route
 * POST /api/admin/patients/export - Body: { patientIds: string[] }
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Patient from '@/models/Patient';
import { logger } from '@/lib/utils/logger.js';
import { canExportData } from '@/lib/permissions/cursor-md-matrix';

async function postHandler(req, user) {
  try {
    if (user.role === 'super_admin') {
      return NextResponse.json(
        errorResponse('Access denied. Platform role has no tenant PHI access.', 'DATA_PRIVACY'),
        { status: 403 }
      );
    }
    if (!canExportData(user.role)) {
      return NextResponse.json(
        errorResponse('You do not have permission to export patient data', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const patientIds = Array.isArray(body.patientIds) ? body.patientIds : [];
    if (patientIds.length === 0) {
      return NextResponse.json(
        errorResponse('Provide at least one patientId in patientIds array', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();

    const query = { _id: { $in: patientIds }, deletedAt: null };
    if (user.role !== 'super_admin' && user.tenantId) {
      query.tenantId = user.tenantId;
    }

    const patients = await Patient.find(query)
      .select('firstName lastName email phone dateOfBirth gender status patientId createdAt')
      .populate('tenantId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    const header = 'Patient ID,First Name,Last Name,Email,Phone,DOB,Gender,Status,Tenant,Created At';
    const rows = patients.map((p) => {
      const escape = (v) => (v == null ? '' : String(v).replace(/"/g, '""'));
      const fmt = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : escape(v));
      return [
        fmt(p.patientId),
        fmt(p.firstName),
        fmt(p.lastName),
        fmt(p.email),
        fmt(p.phone),
        fmt(p.dateOfBirth),
        fmt(p.gender),
        fmt(p.status),
        fmt(p.tenantId?.name ?? p.tenantId),
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...rows].join('\r\n');

    return NextResponse.json(
      successResponse({ csv })
    );
  } catch (err) {
    logger.error('Admin patients export error:', err);
    return NextResponse.json(
      errorResponse(
        err instanceof Error ? err.message : 'Export failed',
        'EXPORT_ERROR'
      ),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user);
}
