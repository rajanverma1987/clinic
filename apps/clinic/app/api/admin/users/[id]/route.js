/**
 * Admin User by ID API - Enable/Disable (Super Admin only)
 * @module app/api/admin/users/[id]/route
 * PUT /api/admin/users/:id - Body: { isActive: boolean }
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import { logger } from '@/lib/utils/logger.js';

async function putHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    if (!id) {
      return NextResponse.json(errorResponse('User ID required', 'VALIDATION_ERROR'), { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const isActive = body.isActive === true || body.isActive === false ? body.isActive : undefined;
    if (isActive === undefined) {
      return NextResponse.json(errorResponse('Provide isActive (boolean)', 'VALIDATION_ERROR'), { status: 400 });
    }
    await connectDB();
    const updated = await User.findOneAndUpdate(
      { _id: id, role: { $ne: 'super_admin' } },
      { $set: { isActive, status: isActive ? 'active' : 'inactive', updatedAt: new Date() } },
      { new: true }
    )
      .select('-password')
      .lean();
    if (!updated) {
      return NextResponse.json(errorResponse('User not found or cannot be updated', 'NOT_FOUND'), { status: 404 });
    }
    return NextResponse.json(
      successResponse({
        id: updated._id.toString(),
        isActive: updated.isActive,
      })
    );
  } catch (err) {
    logger.error('Admin user update error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Update failed', 'UPDATE_ERROR'),
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
