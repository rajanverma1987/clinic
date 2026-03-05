import { MANAGER_ACCESS_IDS } from '@/lib/constants/manager-access.js';
import { isTestAccount } from '@/lib/constants/test-account.js';
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { canAssignAdminManager } from '@/lib/permissions/cursor-md-matrix';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { registerSchema } from '@/lib/validations/auth';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import User, { UserRole } from '@/models/User';
import { NextResponse } from 'next/server';

/**
 * GET /api/users
 * List users (doctors, staff) for the tenant
 * Super admin can see all users across all tenants
 */
async function getHandler(req, user) {
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
      query.$or = [{ tenantId: { $exists: true, $ne: null } }, { role: UserRole.SUPER_ADMIN }];
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
        firstName_es: u.firstName_es || null,
        lastName_es: u.lastName_es || null,
        firstName_ar: u.firstName_ar || null,
        lastName_ar: u.lastName_ar || null,
        phone: u.phone || null,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        tenantId: u.tenantId
          ? typeof u.tenantId === 'object'
            ? u.tenantId._id.toString()
            : u.tenantId.toString()
          : null,
        tenantName: u.tenantId && typeof u.tenantId === 'object' ? u.tenantId.name : null,
      })),
    }),
  );
}

/**
 * POST /api/users
 * Create a new user (doctor/staff/admin)
 * Super admin can create super_admin or clinic_admin
 * Clinic admin can create doctor, manager, staff
 */
async function postHandler(req, user) {
  await connectDB();
  const body = await req.json();

  // Determine target role
  const targetRole = body.role || UserRole.DOCTOR;

  // Doctor and Clinic Admin (clinic admin = doctor account for clinic) can assign Admin or Manager roles
  const assignAdminOrManager = [UserRole.CLINIC_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(
    targetRole,
  );
  if (assignAdminOrManager && !canAssignAdminManager(user.role)) {
    return NextResponse.json(
      errorResponse('Only Doctor or Clinic Admin can assign Admin or Manager roles', 'FORBIDDEN'),
      { status: 403 },
    );
  }

  // Role-based access control
  if (user.role !== 'super_admin') {
    // Doctor and Clinic Admin can assign admin/manager; others have restricted allowedRoles
    const allowedRoles = [
      UserRole.DOCTOR,
      UserRole.CLINIC_ADMIN,
      UserRole.MANAGER,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ACCOUNTANT,
      UserRole.PHARMACIST,
    ];
    if (!canAssignAdminManager(user.role)) {
      // Roles that cannot assign Admin/Manager: only staff roles (no manager, no clinic_admin)
      const allowedForAdmin = [
        UserRole.DOCTOR,
        UserRole.NURSE,
        UserRole.RECEPTIONIST,
        UserRole.ACCOUNTANT,
        UserRole.PHARMACIST,
      ];
      if (!allowedForAdmin.includes(targetRole)) {
        return NextResponse.json(
          errorResponse(`You don't have permission to create ${targetRole} accounts`, 'FORBIDDEN'),
          { status: 403 },
        );
      }
    } else if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json(
        errorResponse(`You don't have permission to create ${targetRole} accounts`, 'FORBIDDEN'),
        { status: 403 },
      );
    }
  } else {
    // Super admin can create: super_admin, clinic_admin, manager (with tenantId)
    if (targetRole === UserRole.SUPER_ADMIN || targetRole === UserRole.CLINIC_ADMIN) {
      // Super admin creating another admin - allowed
    } else if (targetRole === UserRole.MANAGER && body.tenantId) {
      // Super admin creating manager - tenantId from body required
    } else if (!user.tenantId && !body.tenantId) {
      return NextResponse.json(
        errorResponse(
          'Super admin must specify a tenant to create clinic users (manager, staff, etc.)',
          'INVALID_REQUEST',
        ),
        { status: 400 },
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
          return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), {
            status: 404,
          });
        }
        targetTenantId = body.tenantId;
      } else {
        // Creating clinic admin without tenant - would need clinic info
        // For now, require tenantId
        return NextResponse.json(
          errorResponse('Tenant ID is required when creating clinic admin', 'INVALID_REQUEST'),
          { status: 400 },
        );
      }
    } else {
      // Clinic admin creating another clinic admin - use same tenant
      targetTenantId = user.tenantId;
    }
  } else if (targetRole === UserRole.MANAGER && user.role === 'super_admin' && body.tenantId) {
    const Tenant = (await import('@/models/Tenant.js')).default;
    const tenant = await Tenant.findById(body.tenantId);
    if (!tenant) {
      return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
    }
    targetTenantId = body.tenantId;
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
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
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
      { status: 400 },
    );
  }

  // Check subscription user limit (skip for super_admin, test account, and when creating super_admin)
  const skipLimitCheck =
    user.role === 'super_admin' ||
    (user.email && isTestAccount(user.email)) ||
    targetRole === UserRole.SUPER_ADMIN;
  if (!skipLimitCheck && targetTenantId) {
    const { checkUserLimit } = await import('@/services/subscription-check.service');
    const limitCheck = await checkUserLimit(targetTenantId.toString());
    if (!limitCheck.hasAccess) {
      return NextResponse.json(
        errorResponse(limitCheck.reason || 'User limit reached', 'SUBSCRIPTION_LIMIT'),
        { status: 403 },
      );
    }
  }

  // Manager: validate and attach selected access (subscription account chooses from all account access)
  let managerAccess = undefined;
  if (targetRole === UserRole.MANAGER && Array.isArray(body.managerAccess)) {
    const valid = body.managerAccess.filter(
      (id) => typeof id === 'string' && MANAGER_ACCESS_IDS.includes(id),
    );
    if (valid.length > 0) managerAccess = valid;
  }

  // Create user
  const createPayload = {
    email: body.email.toLowerCase(),
    password: body.password,
    firstName: body.firstName,
    lastName: body.lastName,
    role: targetRole,
    tenantId: targetTenantId,
  };
  if (managerAccess) createPayload.managerAccess = managerAccess;
  const newUser = await User.create(createPayload);

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
 * 5. Permission check - Validates USER:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.USER, ACTIONS.READ)(getHandler))),
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
 * 5. Permission check - Validates USER:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.USER, ACTIONS.CREATE)(postHandler))),
  ),
);
