import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { registerSchema } from '@/lib/validations/auth';
import connectDB from '@/lib/db/connection';
import User, { UserRole } from '@/models/User';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/users
 * List users (doctors, staff) for the tenant
 */
async function getHandler(req, user) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const query = { tenantId: user.tenantId };
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
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
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        })),
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch users', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (doctor/staff)
 */
async function postHandler(req, user) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate input - convert tenantId to string for validation
    const validationResult = registerSchema.safeParse({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || UserRole.DOCTOR,
      tenantId: user.tenantId ? user.tenantId.toString() : undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: body.email.toLowerCase(),
      tenantId: user.tenantId,
    });

    if (existingUser) {
      return NextResponse.json(
        errorResponse('User with this email already exists', 'DUPLICATE_EMAIL'),
        { status: 400 }
      );
    }

    // Check subscription user limit (skip for super_admin)
    if (user.role !== 'super_admin') {
      const { checkUserLimit } = await import('@/services/subscription-check.service');
      const limitCheck = await checkUserLimit(user.tenantId.toString());
      if (!limitCheck.hasAccess) {
        return NextResponse.json(
          errorResponse(limitCheck.reason || 'User limit reached', 'SUBSCRIPTION_LIMIT'),
          { status: 403 }
        );
      }
    }

    // Create user
    const newUser = await User.create({
      email: body.email.toLowerCase(),
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || UserRole.DOCTOR,
      tenantId: user.tenantId,
    });

    return NextResponse.json(
      successResponse({
        id: newUser._id.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create user',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

