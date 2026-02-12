/**
 * GET/POST /api/admin/settings/templates
 * Platform-level notification templates (tenantId null) — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import NotificationTemplate from '@/models/NotificationTemplate';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const templates = await NotificationTemplate.find({ tenantId: null })
    .sort({ type: 1, name: 1 })
    .lean();
  return NextResponse.json(successResponse(templates));
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const type = ['appointment', 'prescription', 'payment', 'lab_result', 'system'].includes(
    body.type,
  )
    ? body.type
    : 'system';
  if (!name) {
    return NextResponse.json(
      errorResponse('Name is required', 'VALIDATION_ERROR'),
      { status: 400 },
    );
  }
  await connectDB();
  const template = await NotificationTemplate.create({
    tenantId: null,
    name,
    type,
    channels: body.channels || {
      email: { enabled: true, subject: '', html: '', text: '' },
      sms: { enabled: true, message: '' },
      whatsapp: { enabled: false, message: '' },
    },
    variables: Array.isArray(body.variables) ? body.variables : [],
    isDefault: !!body.isDefault,
    isActive: body.isActive !== false,
  });
  return NextResponse.json(successResponse(template), { status: 201 });
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.CREATE)(postHandler))),
  ),
);
