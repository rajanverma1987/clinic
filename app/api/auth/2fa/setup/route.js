/**
 * POST /api/auth/2fa/setup
 * Setup 2FA for a user
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import speakeasy from 'speakeasy';

/**
 * Generate 2FA secret and QR code
 */
async function setup2FAHandler(req, user) {
  await connectDB();

  // Check if 2FA is already enabled
  const userDoc = await User.findById(user.userId).select('+twoFactorSecret');
  if (userDoc.twoFactorEnabled) {
    return NextResponse.json(
      errorResponse('2FA is already enabled for this account', 'ALREADY_ENABLED'),
      { status: 400 }
    );
  }

  // Generate 2FA secret using speakeasy
  const secret = speakeasy.generateSecret({
    name: `Doctor's Clinic (${userDoc.email})`,
    issuer: 'Doctor\'s Clinic',
  });
  
  // Generate QR code URL
  const otpAuthUrl = secret.otpauth_url;

  // Update user with secret (but don't enable yet - user needs to verify first)
  userDoc.twoFactorSecret = secret.base32; // Store base32 encoded secret
  await userDoc.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user.userId,
    user.userId,
    user.tenantId || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: '2fa_setup_initiated' }
  );

  return NextResponse.json(
    successResponse({
      secret: secret.base32, // Return base32 secret for manual entry
      qrCodeUrl: otpAuthUrl,
      message: 'Scan the QR code with your authenticator app and verify with a code to enable 2FA',
    }),
    { status: 200 }
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(setup2FAHandler)
  )
);
