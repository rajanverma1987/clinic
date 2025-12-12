import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import Tenant from '@/models/Tenant';

/**
 * GET /api/admin/users
 * List all users across all tenants (Super Admin only)
 */
async function getHandler(req, user) {
  try {
    // Check if user is super admin
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const tenantId = searchParams.get('tenantId');
    const isActive = searchParams.get('isActive');
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
      })
    );
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to fetch users',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);

