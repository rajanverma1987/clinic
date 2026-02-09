/**
 * Admin Specialties API (Super Admin only)
 * GET /api/admin/specialties - list
 * POST /api/admin/specialties - create
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Specialty from '@/models/Specialty';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const list = await Specialty.find().sort({ order: 1, name: 1 }).lean();
    const data = list.map((s) => ({
      _id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      order: s.order,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));
    return NextResponse.json(successResponse({ data }));
  } catch (err) {
    logger.error('Admin specialties list error:', err);
    return NextResponse.json(errorResponse(err instanceof Error ? err.message : 'Failed to fetch'), { status: 500 });
  }
}

async function postHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const name = body.name && String(body.name).trim();
    const slug = (body.slug && String(body.slug).trim()) || (name && name.toLowerCase().replace(/\s+/g, '-'));
    if (!name) {
      return NextResponse.json(errorResponse('name is required', 'VALIDATION_ERROR'), { status: 400 });
    }
    await connectDB();
    const specialty = await Specialty.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      icon: body.icon || '',
      order: typeof body.order === 'number' ? body.order : 0,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(successResponse({
      _id: specialty._id.toString(),
      name: specialty.name,
      slug: specialty.slug,
      order: specialty.order,
      isActive: specialty.isActive,
    }), { status: 201 });
  } catch (err) {
    logger.error('Admin specialties create error:', err);
    return NextResponse.json(errorResponse(err instanceof Error ? err.message : 'Failed to create'), { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
