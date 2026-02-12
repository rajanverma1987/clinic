/**
 * 2FA Recovery Codes API
 *
 * GET  /api/auth/2fa/recovery  — return existing recovery codes (hashed for display as *)
 * POST /api/auth/2fa/recovery  — generate a fresh set of 8 recovery codes
 *
 * Recovery codes are single-use: consuming one via verify-2fa removes it from the list.
 */

import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

const CODE_COUNT = 8;
const CODE_BYTES = 5; // 10 hex chars per code

/** Generate a random recovery code like "a1b2c3d4e5" */
function generateCode() {
  return randomBytes(CODE_BYTES).toString('hex');
}

/** One-way hash a recovery code for safe storage */
function hashCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * GET /api/auth/2fa/recovery
 * Returns how many recovery codes remain (not the codes themselves).
 */
async function getHandler(req, user) {
  await connectDB();
  const userDoc = await User.findById(user.userId).select('+twoFactorRecoveryCodes');

  if (!userDoc.twoFactorEnabled) {
    return NextResponse.json(
      errorResponse('2FA must be enabled before managing recovery codes.', 'TWO_FA_REQUIRED'),
      { status: 400 }
    );
  }

  const remaining = (userDoc.twoFactorRecoveryCodes || []).length;
  return NextResponse.json(successResponse({ remaining }));
}

/**
 * POST /api/auth/2fa/recovery
 * Generates a fresh set of 8 single-use recovery codes.
 * Returns the plain-text codes ONCE — user must save them.
 * The stored values are SHA-256 hashes.
 */
async function postHandler(req, user) {
  await connectDB();
  const userDoc = await User.findById(user.userId).select('+twoFactorRecoveryCodes');

  if (!userDoc.twoFactorEnabled) {
    return NextResponse.json(
      errorResponse('2FA must be enabled before generating recovery codes.', 'TWO_FA_REQUIRED'),
      { status: 400 }
    );
  }

  // Generate plain-text codes
  const plainCodes = Array.from({ length: CODE_COUNT }, generateCode);
  // Store hashed versions
  userDoc.twoFactorRecoveryCodes = plainCodes.map(hashCode);
  await userDoc.save();

  await AuditLogger.auditWrite(
    'user',
    user.userId,
    user.userId,
    user.tenantId || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: '2fa_recovery_codes_generated' }
  );

  return NextResponse.json(
    successResponse({
      codes: plainCodes,
      message:
        'Save these codes in a safe place. Each code can only be used once. They will not be shown again.',
    }),
    { status: 201 }
  );
}

export const GET = withErrorHandler(apiRateLimit(withAuth(getHandler)));
export const POST = withErrorHandler(apiRateLimit(withAuth(postHandler)));
