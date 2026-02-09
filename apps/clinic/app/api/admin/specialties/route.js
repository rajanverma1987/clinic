/**
 * Admin Specialties API (Super Admin only)
 * GET /api/admin/specialties - list
 * POST /api/admin/specialties - create
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Specialty from '@/models/Specialty';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
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
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
    const name = body.name && String(body.name).trim();
    const slug =
      (body.slug && String(body.slug).trim()) || (name && name.toLowerCase().replace(/\s+/g, '-'));
    if (!name) {
      return NextResponse.json(errorResponse('name is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
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
    return NextResponse.json(
      successResponse({
        _id: specialty._id.toString(),
        name: specialty.name,
        slug: specialty.slug,
        order: specialty.order,
        isActive: specialty.isActive,
      }),
      { status: 201 },
    );
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates DOCTOR:READ permission (specialties are doctor-related)
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.DOCTOR, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates DOCTOR:CREATE permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.DOCTOR, ACTIONS.CREATE)(postHandler))),
  ),
);
