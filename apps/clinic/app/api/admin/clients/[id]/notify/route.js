/**
 * POST /api/admin/clients/[id]/notify
 * Send in-app notification to all users of a clinic — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import Notification from '@/models/Notification';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function postHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!title || !message) {
    return NextResponse.json(
      errorResponse('Title and message are required', 'VALIDATION_ERROR'),
      { status: 400 },
    );
  }

  const tenantUsers = await User.find({ tenantId, isActive: true })
    .select('_id')
    .lean();

  const notifications = tenantUsers.map((u) => ({
    tenantId,
    userId: u._id,
    type: 'system',
    title,
    message,
    channels: { inApp: { sent: true } },
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Emit real-time notifications
  try {
    const { emitNotification } = await import('@/lib/realtime/realtime-manager.js');
    for (const n of notifications) {
      emitNotification(tenantId, n.userId.toString(), {
        type: 'system',
        title: n.title,
        message: n.message,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    // Don't fail if real-time fails
  }

  return NextResponse.json(
    successResponse({
      message: `Notification sent to ${notifications.length} user(s)`,
      sentCount: notifications.length,
    }),
  );
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return postHandler(req, authResult.user, params.id);
}
