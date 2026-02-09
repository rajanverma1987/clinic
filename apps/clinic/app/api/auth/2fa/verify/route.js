/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code and enable 2FA
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

const verify2FASetupSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only digits'),
});

async function verify2FAHandler(req, user) {
  const body = await req.json();

  // Validate input
  const validationResult = verify2FASetupSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const { code } = validationResult.data;

  await connectDB();

  const userDoc = await User.findById(user.userId).select('+twoFactorSecret');
  
  if (!userDoc.twoFactorSecret) {
    return NextResponse.json(
      errorResponse('2FA setup not initiated. Please setup 2FA first.', 'SETUP_REQUIRED'),
      { status: 400 }
    );
  }

  if (userDoc.twoFactorEnabled) {
    return NextResponse.json(
      errorResponse('2FA is already enabled for this account', 'ALREADY_ENABLED'),
      { status: 400 }
    );
  }

  // Verify the code using speakeasy
  const isValid = speakeasy.totp.verify({
    secret: userDoc.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 2, // Allow 2 time steps before/after
  });
  
  if (!isValid) {
    // Audit log failed attempt
    await AuditLogger.auditWrite(
      'user',
      user.userId,
      user.userId,
      user.tenantId || 'system',
      AuditAction.ACCESS,
      undefined,
      { action: '2fa_verification_failed', reason: 'Invalid code' }
    );

    return NextResponse.json(
      errorResponse('Invalid 2FA code. Please try again.', 'INVALID_CODE'),
      { status: 400 }
    );
  }

  // Enable 2FA
  userDoc.twoFactorEnabled = true;
  await userDoc.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user.userId,
    user.userId,
    user.tenantId || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: '2fa_enabled' }
  );

  return NextResponse.json(
    successResponse({
      message: '2FA has been enabled successfully',
      enabled: true,
    }),
    { status: 200 }
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(verify2FAHandler)
  )
);
