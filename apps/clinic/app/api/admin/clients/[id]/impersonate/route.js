/**
 * POST /api/admin/clients/[id]/impersonate
 * Generate one-time impersonation URL for super_admin to login as clinic admin
 */

import crypto from 'crypto';
import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import ImpersonationToken from '@/models/ImpersonationToken';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import { NextResponse } from 'next/server';

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function postHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }

  const adminUser =
    (await User.findOne({ tenantId, role: 'clinic_admin', isActive: true }).lean()) ||
    (await User.findOne({ tenantId, role: 'admin', isActive: true }).lean()) ||
    (await User.findOne({ tenantId, role: 'doctor', isActive: true }).lean());

  if (!adminUser) {
    return NextResponse.json(
      errorResponse('No active admin/doctor user found for this clinic', 'NO_USER'),
      { status: 404 },
    );
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await ImpersonationToken.create({
    token,
    tenantId,
    createdBy: user.userId || user._id,
    expiresAt,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';
  const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const origin = baseUrl.startsWith('http') ? baseUrl : `${scheme}://${baseUrl || 'localhost:3000'}`;
  const redirectUrl = `${origin}/auth/impersonate?token=${token}`;

  return NextResponse.json(
    successResponse({
      redirectUrl,
      expiresIn: 300,
    }),
  );
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return postHandler(req, authResult.user, params.id);
}
