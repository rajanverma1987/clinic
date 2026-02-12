/**
 * Admin Blog API (Super Admin only)
 * GET /api/admin/blog - list
 * POST /api/admin/blog - create
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

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const list = await BlogPost.find().sort({ order: 1, createdAt: -1 }).lean();
  const data = list.map((s) => ({
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
  }));
  return NextResponse.json(successResponse({ data }));
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const title = body.title && String(body.title).trim();
  const slug =
    (body.slug && String(body.slug).trim()) || (title && title.toLowerCase().replace(/\s+/g, '-'));
  if (!title) {
    return NextResponse.json(errorResponse('title is required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }
  await connectDB();
  const doc = await BlogPost.create({
    title,
    slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
    excerpt: body.excerpt != null ? String(body.excerpt) : '',
    body: body.body != null ? String(body.body) : '',
    status: body.status === 'published' ? 'published' : 'draft',
    order: typeof body.order === 'number' ? body.order : 0,
    isActive: body.isActive !== false,
  });
  return NextResponse.json(
    successResponse({
      _id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      status: doc.status,
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
