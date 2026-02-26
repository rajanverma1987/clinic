/**
 * GET /api/admin/clients/[id]/export
 * Export minimal clinic data for the given tenant (Super Admin only).
 * Returns tenant metadata and entity counts; no PHI. Use for migration planning or backup manifest.
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/Invoice';
import Patient from '@/models/Patient';
import Prescription from '@/models/Prescription';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

async function getHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
    return NextResponse.json(
      errorResponse('Invalid client ID', 'INVALID_ID'),
      { status: 400 },
    );
  }

  await connectDB();

  const tenant = await Tenant.findById(tenantId)
    .select('name slug region createdAt isActive suspended template workflowType betaFeatures')
    .lean();
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }

  try {
    const [
      patientsCount,
      appointmentsCount,
      prescriptionsCount,
      invoicesCount,
      usersCount,
    ] = await Promise.all([
      Patient.countDocuments({ tenantId, deletedAt: null }),
      Appointment.countDocuments({ tenantId, deletedAt: null }),
      Prescription.countDocuments({ tenantId, deletedAt: null }),
      Invoice.countDocuments({ tenantId, deletedAt: null }),
      User.countDocuments({ tenantId }),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        region: tenant.region,
        isActive: tenant.isActive,
        suspended: tenant.suspended,
        template: tenant.template,
        workflowType: tenant.workflowType,
        betaFeatures: tenant.betaFeatures || [],
        createdAt: tenant.createdAt,
      },
      counts: {
        patients: patientsCount,
        appointments: appointmentsCount,
        prescriptions: prescriptionsCount,
        invoices: invoicesCount,
        users: usersCount,
      },
    };

    return NextResponse.json(successResponse(exportPayload));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('GET /api/admin/clients/[id]/export failed', { error: message, tenantId });
    return NextResponse.json(
      errorResponse(message || 'Export failed', 'EXPORT_ERROR'),
      { status: 500 },
    );
  }
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}
