/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for a user
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import speakeasy from 'speakeasy';
import { z } from 'zod';

const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only digits').optional(),
});

async function disable2FAHandler(req, user) {
  const body = await req.json();

  // Validate input
  const validationResult = disable2FASchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const { code, password } = validationResult.data;

  await connectDB();

  const userDoc = await User.findById(user.userId).select('+password +twoFactorSecret');
  
  if (!userDoc.twoFactorEnabled) {
    return NextResponse.json(
      errorResponse('2FA is not enabled for this account', 'NOT_ENABLED'),
      { status: 400 }
    );
  }

  // Verify password
  const isPasswordValid = await userDoc.comparePassword(password);
  if (!isPasswordValid) {
    // Audit log failed attempt
    await AuditLogger.auditWrite(
      'user',
      user.userId,
      user.userId,
      user.tenantId || 'system',
      AuditAction.ACCESS,
      undefined,
      { action: '2fa_disable_failed', reason: 'Invalid password' }
    );

    return NextResponse.json(
      errorResponse('Invalid password', 'INVALID_PASSWORD'),
      { status: 400 }
    );
  }

  // Verify 2FA code if provided (optional but recommended)
  if (code && userDoc.twoFactorSecret) {
    const isValid = speakeasy.totp.verify({
      secret: userDoc.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      await AuditLogger.auditWrite(
        'user',
        user.userId,
        user.userId,
        user.tenantId || 'system',
        AuditAction.ACCESS,
        undefined,
        { action: '2fa_disable_failed', reason: 'Invalid 2FA code' }
      );

      return NextResponse.json(
        errorResponse('Invalid 2FA code', 'INVALID_CODE'),
        { status: 400 }
      );
    }
  }

  // Disable 2FA
  const before = { twoFactorEnabled: userDoc.twoFactorEnabled };
  userDoc.twoFactorEnabled = false;
  userDoc.twoFactorSecret = null;
  await userDoc.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user.userId,
    user.userId,
    user.tenantId || 'system',
    AuditAction.UPDATE,
    { before, after: { twoFactorEnabled: false } },
    { action: '2fa_disabled' }
  );

  return NextResponse.json(
    successResponse({
      message: '2FA has been disabled successfully',
      enabled: false,
    }),
    { status: 200 }
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(disable2FAHandler)
  )
);
