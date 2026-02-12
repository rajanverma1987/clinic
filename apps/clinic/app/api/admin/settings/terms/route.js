/**
 * GET/PUT /api/admin/settings/terms
 * Terms & conditions content — Super Admin only
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
  const doc = await SystemSettings.findOne({ slug: SLUG }).select('content').lean();
  const content = doc?.content?.terms || '';
  return NextResponse.json(successResponse({ content }));
}

async function putHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content : '';
  await connectDB();
  await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { 'content.terms': content, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json(successResponse({ content }));
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);
export const PUT = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(putHandler))),
  ),
);
