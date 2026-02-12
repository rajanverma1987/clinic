/**
 * Admin Static Pages API (Super Admin only)
 * GET /api/admin/pages - list
 * POST /api/admin/pages - create
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import ContentPage from '@/models/ContentPage';
import { NextResponse } from 'next/server';

const VALID_KEYS = ['about', 'contact', 'terms', 'privacy'];

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const list = await ContentPage.find().sort({ key: 1, order: 1, createdAt: -1 }).lean();
  const data = list.map((s) => ({
    _id: s._id.toString(),
    key: s.key,
    title: s.title,
    body: s.body,
    order: s.order,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json(successResponse({ data }));
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const title = body.title && String(body.title).trim();
  const key = body.key && String(body.key).trim().toLowerCase();
  if (!title) {
    return NextResponse.json(errorResponse('title is required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }
  const pageKey = VALID_KEYS.includes(key) ? key : 'about';
  await connectDB();
  const doc = await ContentPage.create({
    key: pageKey,
    title,
    body: body.body != null ? String(body.body) : '',
    order: typeof body.order === 'number' ? body.order : 0,
    isActive: body.isActive !== false,
  });
  return NextResponse.json(
    successResponse({
      _id: doc._id.toString(),
      key: doc.key,
      title: doc.title,
      order: doc.order,
      isActive: doc.isActive,
    }),
    { status: 201 }
  );
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler)))
  )
);
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.CREATE)(postHandler)))
  )
);
