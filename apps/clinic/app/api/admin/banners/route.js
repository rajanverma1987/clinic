/**
 * Admin Banners API (Super Admin only)
 * GET /api/admin/banners - list
 * POST /api/admin/banners - create
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

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const list = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
  const data = list.map((s) => ({
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
  }));
  return NextResponse.json(successResponse({ data }));
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const title = body.title && String(body.title).trim();
  const imageUrl = body.imageUrl && String(body.imageUrl).trim();
  if (!title || !imageUrl) {
    return NextResponse.json(
      errorResponse('title and imageUrl are required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }
  await connectDB();
  const doc = await Banner.create({
    title,
    imageUrl,
    linkUrl: body.linkUrl != null ? String(body.linkUrl) : '',
    order: typeof body.order === 'number' ? body.order : 0,
    startDate: body.startDate ? new Date(body.startDate) : null,
    endDate: body.endDate ? new Date(body.endDate) : null,
    isActive: body.isActive !== false,
  });
  return NextResponse.json(
    successResponse({
      _id: doc._id.toString(),
      title: doc.title,
      imageUrl: doc.imageUrl,
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
