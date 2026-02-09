/**
 * Admin System Settings – Security (Super Admin only)
 * GET /api/admin/settings/security – returns security settings
 * PUT /api/admin/settings/security – updates security settings
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import SystemSettings from '@/models/SystemSettings';
import { logger } from '@/lib/utils/logger.js';

const SLUG = 'platform';

async function getHandler(req, user) {
  try {
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
  } catch (err) {
    logger.error('Admin settings security get error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch settings', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

async function putHandler(req, user) {
  try {
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
      ...(typeof body.sessionTimeoutMinutes === 'number' && { sessionTimeoutMinutes: body.sessionTimeoutMinutes }),
      ...(typeof body.passwordMinLength === 'number' && { passwordMinLength: body.passwordMinLength }),
      ...(typeof body.passwordRequireSpecial === 'boolean' && { passwordRequireSpecial: body.passwordRequireSpecial }),
      ...(typeof body.require2FAForAdmin === 'boolean' && { require2FAForAdmin: body.require2FAForAdmin }),
      ...(typeof body.failedLoginMaxAttempts === 'number' && { failedLoginMaxAttempts: body.failedLoginMaxAttempts }),
      ...(typeof body.failedLoginLockoutMinutes === 'number' && { failedLoginLockoutMinutes: body.failedLoginLockoutMinutes }),
      ...(typeof body.ipWhitelistEnabled === 'boolean' && { ipWhitelistEnabled: body.ipWhitelistEnabled }),
      ...(typeof body.auditLogRetentionDays === 'number' && { auditLogRetentionDays: body.auditLogRetentionDays }),
    };
    const updated = await SystemSettings.findOneAndUpdate(
      { slug: SLUG },
      { $set: { security, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return NextResponse.json(successResponse(updated.security || {}));
  } catch (err) {
    logger.error('Admin settings security put error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to update settings', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
