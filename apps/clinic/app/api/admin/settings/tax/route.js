/**
 * Admin Tax Settings (Super Admin only)
 * GET/PUT /api/admin/settings/tax
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
  const tax = doc.tax || {
    defaultTaxType: 'NONE',
    defaultTaxRate: 0,
    defaultCountry: '',
  };
  return NextResponse.json(successResponse(tax));
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
  const tax = {
    defaultTaxType: ['GST', 'VAT', 'SALES_TAX', 'NONE'].includes(body.defaultTaxType)
      ? body.defaultTaxType
      : (doc?.tax?.defaultTaxType ?? 'NONE'),
    defaultTaxRate:
      typeof body.defaultTaxRate === 'number' &&
      body.defaultTaxRate >= 0 &&
      body.defaultTaxRate <= 100
        ? body.defaultTaxRate
        : (doc?.tax?.defaultTaxRate ?? 0),
    defaultCountry:
      typeof body.defaultCountry === 'string'
        ? body.defaultCountry.trim()
        : (doc?.tax?.defaultCountry ?? ''),
  };
  const updated = await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { tax, updatedAt: new Date() } },
    { new: true },
  ).lean();
  return NextResponse.json(successResponse(updated.tax || tax));
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
