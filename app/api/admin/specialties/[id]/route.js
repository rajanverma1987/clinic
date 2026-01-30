/**
 * Admin Specialty by ID (Super Admin only)
 * GET /api/admin/specialties/:id
 * PUT /api/admin/specialties/:id
 * DELETE /api/admin/specialties/:id
 */
import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Specialty from '@/models/Specialty';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const s = await Specialty.findById(id).lean();
    if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
    return NextResponse.json(successResponse({
      _id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      order: s.order,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  } catch (err) {
    logger.error('Admin specialty get error:', err);
    return NextResponse.json(errorResponse(err instanceof Error ? err.message : 'Failed'), { status: 500 });
  }
}

async function putHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    await connectDB();
    const update = {};
    if (body.name != null) update.name = String(body.name).trim();
    if (body.slug != null) update.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, '-');
    if (body.description != null) update.description = String(body.description);
    if (body.icon != null) update.icon = String(body.icon);
    if (typeof body.order === 'number') update.order = body.order;
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;
    const s = await Specialty.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
    return NextResponse.json(successResponse({
      _id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      order: s.order,
      isActive: s.isActive,
    }));
  } catch (err) {
    logger.error('Admin specialty update error:', err);
    return NextResponse.json(errorResponse(err instanceof Error ? err.message : 'Failed'), { status: 500 });
  }
}

async function deleteHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const s = await Specialty.findByIdAndDelete(id);
    if (!s) return NextResponse.json(errorResponse('Not found', 'NOT_FOUND'), { status: 404 });
    return NextResponse.json(successResponse({ _id: id, deleted: true }));
  } catch (err) {
    logger.error('Admin specialty delete error:', err);
    return NextResponse.json(errorResponse(err instanceof Error ? err.message : 'Failed'), { status: 500 });
  }
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
