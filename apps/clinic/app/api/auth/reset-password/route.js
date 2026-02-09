/**
 * Reset Password API Route
 * Resets password using secret code from email
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { z } from 'zod';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  secretCode: z.string().length(6, 'Secret code must be 6 digits').regex(/^\d{6}$/, 'Secret code must contain only digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/**
 * POST /api/auth/reset-password
 * Reset password using secret code
 */
async function postHandler(req) {
  await connectDB();
  const body = await req.json();

  // Validate input
  const validationResult = resetPasswordSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const { email, secretCode, newPassword } = validationResult.data;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return NextResponse.json(
      errorResponse('Invalid email or secret code', 'INVALID_CODE'),
      { status: 400 }
    );
  }

  // Build query to find reset code
  const resetQuery = {
    email: email.toLowerCase(),
    secretCode,
    used: false,
    expiresAt: { $gt: new Date() },
  };
  // Handle tenantId (null for super_admin, specific value for others)
  if (user.tenantId) {
    resetQuery.tenantId = user.tenantId;
  } else {
    resetQuery.tenantId = null;
  }

  // Find valid reset code
  const resetRecord = await PasswordReset.findOne(resetQuery);

  if (!resetRecord) {
    return NextResponse.json(
      errorResponse('Invalid or expired secret code', 'INVALID_CODE'),
      { status: 400 }
    );
  }

  // Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0; // Reset failed attempts
  user.accountLockedUntil = null; // Unlock account
  await user.save();

  // Mark reset code as used
  resetRecord.used = true;
  await resetRecord.save();

  // Build query for invalidating other codes
  const invalidateQuery = {
    email: email.toLowerCase(),
    used: false,
  };
  if (user.tenantId) {
    invalidateQuery.tenantId = user.tenantId;
  } else {
    invalidateQuery.tenantId = null;
  }

  // Invalidate all other reset codes for this user
  await PasswordReset.updateMany(invalidateQuery, { used: true });

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    user.tenantId?.toString() || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: 'password_reset' }
  );

  return NextResponse.json(
    successResponse({
      message: 'Password reset successfully. You can now login with your new password.',
    })
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(postHandler)
);
