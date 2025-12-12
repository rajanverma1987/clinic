import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { registerSchema } from '@/lib/validations/auth';
import connectDB from '@/lib/db/connection';
import User, { UserRole } from '@/models/User';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/users
 * List users (doctors, staff) for the tenant
 * Super admin can see all users across all tenants
 */
async function getHandler(req, user) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const tenantId = searchParams.get('tenantId'); // For super admin to filter by tenant

    // Build query based on user role
    let query = {};
    
    if (user.role === 'super_admin') {
      // Super admin can see all users
      if (tenantId) {
        query.tenantId = tenantId;
      } else {
        // Show all users including super admins (tenantId: null)
        query.$or = [
          { tenantId: { $exists: true, $ne: null } },
          { role: UserRole.SUPER_ADMIN }
        ];
      }
    } else {
      // Regular users see only their tenant's users
      query.tenantId = user.tenantId;
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('tenantId', 'name slug') // Populate tenant info for super admin
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
          tenantId: u.tenantId ? (typeof u.tenantId === 'object' ? u.tenantId._id.toString() : u.tenantId.toString()) : null,
          tenantName: u.tenantId && typeof u.tenantId === 'object' ? u.tenantId.name : null,
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
 * Create a new user (doctor/staff/admin)
 * Super admin can create super_admin or clinic_admin
 * Clinic admin can create doctor, manager, staff
 */
async function postHandler(req, user) {
  try {
    await connectDB();
    const body = await req.json();

    // Determine target role
    const targetRole = body.role || UserRole.DOCTOR;
    
    // Role-based access control
    if (user.role !== 'super_admin') {
      // Clinic admins can only create: doctor, manager, nurse, receptionist, accountant, pharmacist
      const allowedRoles = [
        UserRole.DOCTOR,
        UserRole.MANAGER,
        UserRole.NURSE,
        UserRole.RECEPTIONIST,
        UserRole.ACCOUNTANT,
        UserRole.PHARMACIST,
      ];
      if (!allowedRoles.includes(targetRole)) {
        return NextResponse.json(
          errorResponse(`You don't have permission to create ${targetRole} accounts`, 'FORBIDDEN'),
          { status: 403 }
        );
      }
    } else {
      // Super admin can create: super_admin, clinic_admin
      // For other roles, they need to be within a tenant context
      if (targetRole === UserRole.SUPER_ADMIN || targetRole === UserRole.CLINIC_ADMIN) {
        // Super admin creating another admin - allowed
      } else if (!user.tenantId) {
        // Super admin without tenant context can't create tenant-specific roles
        return NextResponse.json(
          errorResponse('Super admin must specify a tenant to create clinic users', 'INVALID_REQUEST'),
          { status: 400 }
        );
      }
    }

    // Determine tenantId for new user
    let targetTenantId = null;
    
    if (targetRole === UserRole.SUPER_ADMIN) {
      // Super admin has no tenantId
      targetTenantId = null;
    } else if (targetRole === UserRole.CLINIC_ADMIN) {
      // Clinic admin needs a tenant - if super admin is creating, they need to provide tenantId
      if (user.role === 'super_admin') {
        if (body.tenantId) {
          // Assign to existing tenant
          const Tenant = (await import('@/models/Tenant.js')).default;
          const tenant = await Tenant.findById(body.tenantId);
          if (!tenant) {
            return NextResponse.json(
              errorResponse('Tenant not found', 'NOT_FOUND'),
              { status: 404 }
            );
          }
          targetTenantId = body.tenantId;
        } else {
          // Creating clinic admin without tenant - would need clinic info
          // For now, require tenantId
          return NextResponse.json(
            errorResponse('Tenant ID is required when creating clinic admin', 'INVALID_REQUEST'),
            { status: 400 }
          );
        }
      } else {
        // Clinic admin creating another clinic admin - use same tenant
        targetTenantId = user.tenantId;
      }
    } else {
      // All other roles use the creator's tenantId
      targetTenantId = user.tenantId;
    }

    // Validate input
    const validationResult = registerSchema.safeParse({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: targetRole,
      tenantId: targetTenantId ? targetTenantId.toString() : undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    if (targetRole === UserRole.SUPER_ADMIN) {
      // Super admin - check globally (no tenantId)
      existingUser = await User.findOne({
        email: body.email.toLowerCase(),
        role: UserRole.SUPER_ADMIN,
      });
    } else {
      // Other roles - check within tenant
      existingUser = await User.findOne({
        email: body.email.toLowerCase(),
        tenantId: targetTenantId,
      });
    }

    if (existingUser) {
      return NextResponse.json(
        errorResponse('User with this email already exists', 'DUPLICATE_EMAIL'),
        { status: 400 }
      );
    }

    // Check subscription user limit (skip for super_admin and when creating super_admin)
    if (user.role !== 'super_admin' && targetRole !== UserRole.SUPER_ADMIN && targetTenantId) {
      const { checkUserLimit } = await import('@/services/subscription-check.service');
      const limitCheck = await checkUserLimit(targetTenantId.toString());
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
      role: targetRole,
      tenantId: targetTenantId,
    });

    return NextResponse.json(
      successResponse({
        id: newUser._id.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
        tenantId: newUser.tenantId ? newUser.tenantId.toString() : null,
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
