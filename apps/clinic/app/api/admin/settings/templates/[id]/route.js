/**
 * GET/PUT/DELETE /api/admin/settings/templates/[id]
 * Platform-level notification template — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import NotificationTemplate from '@/models/NotificationTemplate';
import { NextResponse } from 'next/server';

async function getHandler(req, user, templateId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const template = await NotificationTemplate.findOne({
    _id: templateId,
    tenantId: null,
  }).lean();
  if (!template) {
    return NextResponse.json(errorResponse('Template not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(template));
}

async function putHandler(req, user, templateId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  await connectDB();
  const existing = await NotificationTemplate.findOne({
    _id: templateId,
    tenantId: null,
  });
  if (!existing) {
    return NextResponse.json(errorResponse('Template not found', 'NOT_FOUND'), { status: 404 });
  }
  if (typeof body.name === 'string' && body.name.trim()) existing.name = body.name.trim();
  if (['appointment', 'prescription', 'payment', 'lab_result', 'system'].includes(body.type))
    existing.type = body.type;
  if (body.channels) existing.channels = { ...existing.channels, ...body.channels };
  if (Array.isArray(body.variables)) existing.variables = body.variables;
  if (body.isDefault !== undefined) existing.isDefault = !!body.isDefault;
  if (body.isActive !== undefined) existing.isActive = !!body.isActive;
  await existing.save();
  return NextResponse.json(successResponse(existing.toObject()));
}

async function deleteHandler(req, user, templateId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const result = await NotificationTemplate.deleteOne({
    _id: templateId,
    tenantId: null,
  });
  if (result.deletedCount === 0) {
    return NextResponse.json(errorResponse('Template not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse({ deleted: true }));
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return putHandler(req, authResult.user, params.id);
}

export async function DELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return deleteHandler(req, authResult.user, params.id);
}
