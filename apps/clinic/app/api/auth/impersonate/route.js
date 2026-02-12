/**
 * GET /api/auth/impersonate?token=xxx
 * Validates one-time impersonation token, returns accessToken and refreshToken for clinic admin.
 * Client page stores tokens and redirects to dashboard.
 */

import connectDB from '@/lib/db/connection';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { successResponse } from '@/lib/utils/api-response';
import User from '@/models/User';
import ImpersonationToken from '@/models/ImpersonationToken';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'missing_token' }, { status: 400 });
  }

  await connectDB();

  const record = await ImpersonationToken.findOneAndDelete({ token }).lean();
  if (!record || new Date() > new Date(record.expiresAt)) {
    return NextResponse.json({ success: false, error: 'invalid_or_expired' }, { status: 400 });
  }

  const targetUser = await User.findOne({
    tenantId: record.tenantId,
    role: { $in: ['clinic_admin', 'admin', 'doctor'] },
    isActive: true,
  })
    .select('_id email firstName lastName role tenantId')
    .lean();

  if (!targetUser) {
    return NextResponse.json({ success: false, error: 'no_user' }, { status: 404 });
  }

  const tenantId = targetUser.tenantId?.toString() || '';
  const tokenPayload = {
    userId: targetUser._id.toString(),
    tenantId,
    email: targetUser.email,
    role: targetUser.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return NextResponse.json(
    successResponse({
      accessToken,
      refreshToken,
      user: {
        id: targetUser._id.toString(),
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        tenantId,
      },
    }),
  );
}
