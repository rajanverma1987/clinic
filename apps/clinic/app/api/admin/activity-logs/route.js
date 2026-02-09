/**
 * Admin Activity Logs API (Super Admin only)
 * @module app/api/admin/activity-logs/route
 * GET /api/admin/activity-logs?userId=&action=&resource=&resourceId=&page=&limit=
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
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const resourceId = searchParams.get('resourceId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;

    const total = await AuditLog.countDocuments(query);
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = logs.map((l) => ({
      _id: l._id.toString(),
      userId: l.userId?._id?.toString(),
      userName: l.userId ? `${l.userId.firstName || ''} ${l.userId.lastName || ''}`.trim() : null,
      userEmail: l.userId?.email,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId?.toString(),
      details: l.details,
      ipAddress: l.ipAddress,
      timestamp: l.timestamp,
      phiAccessed: l.phiAccessed,
    }));

    return NextResponse.json(
      successResponse({
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }),
    );
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates AUDIT_LOG:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.AUDIT_LOG, ACTIONS.READ)(getHandler))),
  ),
);
