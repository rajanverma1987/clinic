/**
 * GET /api/admin/clients/[id]/usage
 * Returns usage stats for a clinic (patients count, managers count) — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import Patient from '@/models/Patient';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function getHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }

  const [patientsCount, managersCount, doctorsCount, appointmentsCount, lastActivity] =
    await Promise.all([
      Patient.countDocuments({ tenantId, deletedAt: null }),
      User.countDocuments({ tenantId, role: 'manager', isActive: true }),
      User.countDocuments({
        tenantId,
        role: { $in: ['doctor', 'admin', 'clinic_admin'] },
        isActive: true,
      }),
      (async () => {
        const Appointment = (await import('@/models/Appointment')).default;
        return Appointment.countDocuments({ tenantId, deletedAt: null });
      })(),
      User.findOne({ tenantId })
        .sort({ lastLoginAt: -1 })
        .select('lastLoginAt')
        .lean()
        .then((u) => (u?.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null)),
    ]);

  return NextResponse.json(
    successResponse({
      patientsCount,
      managersCount,
      staffCount: doctorsCount,
      appointmentsCount,
      lastActivity,
    }),
  );
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}
