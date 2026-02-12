/**
 * POST /api/admin/activity-logs/cleanup
 * Deletes audit logs older than retention period (from SystemSettings.security.auditLogRetentionDays).
 * Super Admin only.
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import AuditLog from '@/models/AuditLog';
import SystemSettings from '@/models/SystemSettings';
import { NextResponse } from 'next/server';

const SLUG = 'platform';
const DEFAULT_RETENTION_DAYS = 365;
const MIN_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 3650;

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();

  const settings = await SystemSettings.findOne({ slug: SLUG })
    .select('security.auditLogRetentionDays')
    .lean();
  let retentionDays = settings?.security?.auditLogRetentionDays ?? DEFAULT_RETENTION_DAYS;
  retentionDays = Math.min(MAX_RETENTION_DAYS, Math.max(MIN_RETENTION_DAYS, Number(retentionDays) || DEFAULT_RETENTION_DAYS));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoff } });

  return NextResponse.json(
    successResponse({
      deleted: result.deletedCount,
      cutoff: cutoff.toISOString(),
      retentionDays,
    }),
  );
}

export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.AUDIT_LOG, ACTIONS.DELETE)(postHandler))),
  ),
);
