/**
 * Change Password API Route
 * Allows authenticated users to change their own password
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { changePasswordSchema } from '@/lib/validations/auth';
import { changePassword } from '@/services/auth.service';

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
async function postHandler(req, user) {
  const body = await req.json();

  // Validate input
  const validationResult = changePasswordSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  // Change password - currentPassword is optional for first login
  await changePassword(
    user.userId,
    validationResult.data.currentPassword || null, // null for first login
    validationResult.data.newPassword,
    user.tenantId
  );

  return NextResponse.json(
    successResponse({
      message: 'Password changed successfully',
    }),
    { status: 200 }
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(postHandler)
  )
);
