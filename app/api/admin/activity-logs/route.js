/**
 * Admin Activity Logs API (Super Admin only)
 * @module app/api/admin/activity-logs/route
 * GET /api/admin/activity-logs?userId=&action=&resource=&page=&limit=
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import AuditLog from '@/models/AuditLog';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;

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
      })
    );
  } catch (err) {
    logger.error('Admin activity-logs error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch logs', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);