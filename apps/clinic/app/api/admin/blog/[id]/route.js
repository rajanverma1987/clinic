/**
 * Admin Blog by ID (Super Admin only)
 * GET /api/admin/blog/:id, PUT /api/admin/blog/:id, DELETE /api/admin/blog/:id
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import BlogPost from '@/models/BlogPost';
import { NextResponse } from 'next/server';

function toDto(s) {
  return {
    _id: s._id.toString(),
    title: s.title,
    slug: s.slug,
    excerpt: s.excerpt,
    body: s.body,
    status: s.status,
    order: s.order,
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
  const s = await BlogPost.findById(id).lean();
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
  if (body.slug != null) update.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, '-');
  if (body.excerpt != null) update.excerpt = String(body.excerpt);
  if (body.body != null) update.body = String(body.body);
  if (body.status === 'published' || body.status === 'draft') update.status = body.status;
  if (typeof body.order === 'number') update.order = body.order;
  if (typeof body.isActive === 'boolean') update.isActive = body.isActive;
  const s = await BlogPost.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse(toDto(s)));
}

async function deleteHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const s = await BlogPost.findByIdAndDelete(id);
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse({ _id: id, deleted: true }));
}

async function handlerGET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}
async function handlerPUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return putHandler(req, authResult.user, params.id);
}
async function handlerDELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return deleteHandler(req, authResult.user, params.id);
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
