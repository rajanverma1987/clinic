/**
 * Admin Force Logout (Super Admin only)
 * POST /api/admin/users/:id/force-logout
 * Revokes all sessions for the user by bumping tokenVersion.
 */

import connectDB from '@/lib/db/connection';
import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import User from '@/models/User';
import { logger } from '@/lib/utils/logger';
import { NextResponse } from 'next/server';

async function postHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  if (!id) {
    return NextResponse.json(errorResponse('User ID required', 'VALIDATION_ERROR'), { status: 400 });
  }

  await connectDB();
  const targetUser = await User.findOne({ _id: id }).select('email role tokenVersion');
  if (!targetUser) {
    return NextResponse.json(errorResponse('User not found', 'NOT_FOUND'), { status: 404 });
  }
  if (targetUser.role === 'super_admin') {
    return NextResponse.json(
      errorResponse('Cannot force logout another Super Admin', 'FORBIDDEN'),
      { status: 403 },
    );
  }

  const previousVersion = targetUser.tokenVersion ?? 0;
  await User.updateOne(
    { _id: id },
    { $set: { tokenVersion: previousVersion + 1, updatedAt: new Date() } },
  );

  await AuditLogger.auditWrite(
    'user',
    id,
    user.userId || user.id,
    user.tenantId || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: 'force_logout', targetUserId: id },
  );

  logger.info('Admin force logout', { targetUserId: id, performedBy: user.userId });
  return NextResponse.json(
    successResponse({ message: 'All sessions revoked for this user' }),
  );
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return postHandler(req, authResult.user, params.id);
}
