/**
 * Staff Registration API Route
 * Allows admin/super_admin to create staff accounts
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { registerStaffSchema } from '@/lib/validations/staff-registration';
import { registerStaff } from '@/services/staff-registration.service';

/**
 * POST /api/users/register-staff
 * Create a new staff account (admin/super_admin only)
 */
async function postHandler(req, user) {
  const body = await req.json();

  // Validate input
  const validationResult = registerStaffSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  // Register staff member
  const result = await registerStaff(
    validationResult.data,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(
    successResponse(result),
    { status: 201 }
  );
}

// Apply middleware stack (admin/super_admin only)
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.USER, ACTIONS.CREATE)(postHandler)
    )
  )
);
