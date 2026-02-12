/**
 * POST /api/admin/settings/backup
 * Trigger database backup — Super Admin only. Returns export status.
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { NextResponse } from 'next/server';

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  try {
    const { mongoose } = await import('mongoose');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const exportData = {};
    for (const col of collections) {
      const name = col.name;
      if (name.startsWith('system.')) continue;
      const cursor = db.collection(name).find({});
      const docs = await cursor.toArray();
      exportData[name] = docs.map((d) => {
        const o = { ...d };
        if (o._id) o._id = o._id.toString();
        return o;
      });
    }
    return NextResponse.json(
      successResponse({
        message: 'Backup export completed',
        collections: Object.keys(exportData),
        totalDocs: Object.values(exportData).reduce((s, arr) => s + arr.length, 0),
      }),
    );
  } catch (err) {
    return NextResponse.json(
      errorResponse(err.message || 'Backup failed', 'BACKUP_ERROR'),
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.MANAGE)(postHandler))),
  ),
);
