/**
 * Admin FAQ by ID (Super Admin only)
 * GET /api/admin/faqs/:id, PUT /api/admin/faqs/:id, DELETE /api/admin/faqs/:id
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import FAQ from '@/models/FAQ';
import { NextResponse } from 'next/server';

function toDto(s) {
  return {
    _id: s._id.toString(),
    question: s.question,
    answer: s.answer,
    category: s.category,
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
  const s = await FAQ.findById(id).lean();
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
  if (body.question != null) update.question = String(body.question).trim();
  if (body.answer != null) update.answer = String(body.answer);
  if (body.category === 'patients' || body.category === 'doctors' || body.category === 'general')
    update.category = body.category;
  if (typeof body.order === 'number') update.order = body.order;
  if (typeof body.isActive === 'boolean') update.isActive = body.isActive;
  const s = await FAQ.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(successResponse(toDto(s)));
}

async function deleteHandler(req, user, id) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const s = await FAQ.findByIdAndDelete(id);
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
