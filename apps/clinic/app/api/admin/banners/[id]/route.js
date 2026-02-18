/**
 * Admin Banner by ID (Super Admin only)
 * GET /api/admin/banners/:id, PUT /api/admin/banners/:id, DELETE /api/admin/banners/:id
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Banner from '@/models/Banner';
import { NextResponse } from 'next/server';

function toDto(s) {
  return {
    _id: s._id.toString(),
    title: s.title,
    imageUrl: s.imageUrl,
    linkUrl: s.linkUrl,
    order: s.order,
    startDate: s.startDate,
    endDate: s.endDate,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

async function getHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const s = await Banner.findById(id).lean();
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse(toDto(s)));
}

async function putHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  await connectDB();
  const update = {};
  if (body.title != null) update.title = String(body.title).trim();
  if (body.imageUrl != null) update.imageUrl = String(body.imageUrl).trim();
  if (body.linkUrl != null) update.linkUrl = String(body.linkUrl);
  if (typeof body.order === 'number') update.order = body.order;
  if (body.startDate !== undefined) update.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) update.endDate = body.endDate ? new Date(body.endDate) : null;
  if (typeof body.isActive === 'boolean') update.isActive = body.isActive;
  const s = await Banner.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse(toDto(s)));
}

async function deleteHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const s = await Banner.findByIdAndDelete(id);
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse({ _id: id, deleted: true }));
}

async function handlerGET(req, user, context) {
  const params = context?.params != null ? await Promise.resolve(context.params) : {};
  const id = params.id;
  if (!id) return NextResponse.json(errorResponse('Missing id', 'BAD_REQUEST'), { status: 400 });
  return getHandler(req, user, id);
}
async function handlerPUT(req, user, context) {
  const params = context?.params != null ? await Promise.resolve(context.params) : {};
  const id = params.id;
  if (!id) return NextResponse.json(errorResponse('Missing id', 'BAD_REQUEST'), { status: 400 });
  return putHandler(req, user, id);
}
async function handlerDELETE(req, user, context) {
  const params = context?.params != null ? await Promise.resolve(context.params) : {};
  const id = params.id;
  if (!id) return NextResponse.json(errorResponse('Missing id', 'BAD_REQUEST'), { status: 400 });
  return deleteHandler(req, user, id);
}

export const GET = withErrorHandler(
  withRequestLogger(apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(handlerGET))))
);
export const PUT = withErrorHandler(
  withRequestLogger(apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(handlerPUT))))
);
export const DELETE = withErrorHandler(
  withRequestLogger(apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.DELETE)(handlerDELETE))))
);
