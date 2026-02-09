/**
 * Admin System Settings – Security (Super Admin only)
 * GET /api/admin/settings/security – returns security settings
 * PUT /api/admin/settings/security – updates security settings
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import SystemSettings from '@/models/SystemSettings';
import { NextResponse } from 'next/server';

const SLUG = 'platform';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  let doc = await SystemSettings.findOne({ slug: SLUG }).lean();
  if (!doc) {
    doc = await SystemSettings.create({ slug: SLUG });
    doc = doc.toObject();
  }
  return NextResponse.json(successResponse(doc.security || {}));
}

async function putHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  await connectDB();
  let doc = await SystemSettings.findOne({ slug: SLUG }).lean();
  if (!doc) {
    await SystemSettings.create({ slug: SLUG });
    doc = { security: {} };
  }
  const existing = doc.security || {};
  const security = {
    ...existing,
    ...(typeof body.sessionTimeoutMinutes === 'number' && {
      sessionTimeoutMinutes: body.sessionTimeoutMinutes,
    }),
    ...(typeof body.passwordMinLength === 'number' && {
      passwordMinLength: body.passwordMinLength,
    }),
    ...(typeof body.passwordRequireSpecial === 'boolean' && {
      passwordRequireSpecial: body.passwordRequireSpecial,
    }),
    ...(typeof body.require2FAForAdmin === 'boolean' && {
      require2FAForAdmin: body.require2FAForAdmin,
    }),
    ...(typeof body.failedLoginMaxAttempts === 'number' && {
      failedLoginMaxAttempts: body.failedLoginMaxAttempts,
    }),
    ...(typeof body.failedLoginLockoutMinutes === 'number' && {
      failedLoginLockoutMinutes: body.failedLoginLockoutMinutes,
    }),
    ...(typeof body.ipWhitelistEnabled === 'boolean' && {
      ipWhitelistEnabled: body.ipWhitelistEnabled,
    }),
    ...(typeof body.auditLogRetentionDays === 'number' && {
      auditLogRetentionDays: body.auditLogRetentionDays,
    }),
  };
  const updated = await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { security, updatedAt: new Date() } },
    { new: true },
  ).lean();
  return NextResponse.json(successResponse(updated.security || {}));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SETTINGS:READ permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to PUT endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SETTINGS:UPDATE permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const PUT = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(putHandler))),
  ),
);
