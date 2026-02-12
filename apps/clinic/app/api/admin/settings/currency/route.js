/**
 * Admin Currency Settings (Super Admin only)
 * GET/PUT /api/admin/settings/currency
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
  const currency = doc.currency || {
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
  };
  return NextResponse.json(successResponse(currency));
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
  }
  const currency = {
    defaultCurrency:
      typeof body.defaultCurrency === 'string' && body.defaultCurrency.trim().length === 3
        ? body.defaultCurrency.trim().toUpperCase()
        : (doc?.currency?.defaultCurrency ?? 'USD'),
    supportedCurrencies: Array.isArray(body.supportedCurrencies)
      ? body.supportedCurrencies
          .filter((c) => typeof c === 'string' && c.trim().length === 3)
          .map((c) => c.trim().toUpperCase())
      : (doc?.currency?.supportedCurrencies ?? ['USD', 'EUR', 'GBP', 'INR']),
  };
  const updated = await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { currency, updatedAt: new Date() } },
    { new: true },
  ).lean();
  return NextResponse.json(successResponse(updated.currency || currency));
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
