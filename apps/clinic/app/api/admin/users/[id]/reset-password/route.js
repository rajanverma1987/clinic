/**
 * Admin Reset User Password (Super Admin only)
 * POST /api/admin/users/:id/reset-password
 * Body: { newPassword: string }
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const MIN_PASSWORD_LENGTH = 8;

async function postHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  if (!id) {
    return NextResponse.json(errorResponse('User ID required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  const body = await req.json().catch(() => ({}));
  const newPassword = body.newPassword?.trim();
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      errorResponse(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        'VALIDATION_ERROR',
      ),
      { status: 400 },
    );
  }

  await connectDB();
  const targetUser = await User.findOne({ _id: id, role: { $ne: 'super_admin' } });
  if (!targetUser) {
    return NextResponse.json(errorResponse('User not found', 'NOT_FOUND'), { status: 404 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne(
    { _id: id },
    { $set: { password: hashed, passwordChangedAt: new Date(), updatedAt: new Date() } },
  );

  return NextResponse.json(successResponse({ message: 'Password reset successfully' }));
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user, params.id);
}
