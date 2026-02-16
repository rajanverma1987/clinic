import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import User from '@/models/User';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/users
 * List all users across all tenants (Super Admin only)
 */
async function getHandler(req, user) {
  // Check if user is super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const tenantId = searchParams.get('tenantId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query - exclude super admins from tenant-specific queries
    const query = { role: { $ne: 'super_admin' } };

    if (role) {
      query.role = role;
    }

    if (tenantId) {
      query.tenantId = tenantId;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('tenantId', 'name slug region')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json(
      successResponse({
        data: users.map((u) => ({
          id: u._id.toString(),
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: u.isActive,
          tenantId: u.tenantId ? u.tenantId._id.toString() : null,
          tenantName: u.tenantId ? u.tenantId.name : null,
          tenantSlug: u.tenantId ? u.tenantId.slug : null,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
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
 * 5. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(withRequestLogger(apiRateLimit(withAuth(getHandler))));
