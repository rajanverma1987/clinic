/**
 * Admin System Settings – General (Super Admin only)
 * GET /api/admin/settings/general – returns general platform settings
 * PUT /api/admin/settings/general – updates general settings
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
    return NextResponse.json(successResponse(doc.general || {}));
  } catch (err) {
    logger.error('Admin settings general get error:', err);
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
      doc = { general: {} };
    }
    const existing = doc.general || {};
    const general = {
      ...existing,
      ...(typeof body.platformName === 'string' && { platformName: body.platformName.trim() }),
      ...(typeof body.supportEmail === 'string' && { supportEmail: body.supportEmail.trim() }),
      ...(typeof body.supportPhone === 'string' && { supportPhone: body.supportPhone.trim() }),
      ...(typeof body.businessHours === 'string' && { businessHours: body.businessHours.trim() }),
      ...(typeof body.timezone === 'string' && { timezone: body.timezone.trim() }),
      ...(typeof body.dateFormat === 'string' && { dateFormat: body.dateFormat.trim() }),
      ...(typeof body.currencyFormat === 'string' && { currencyFormat: body.currencyFormat.trim() }),
    };
    const updated = await SystemSettings.findOneAndUpdate(
      { slug: SLUG },
      { $set: { general, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return NextResponse.json(successResponse(updated.general || {}));
  } catch (err) {
    logger.error('Admin settings general put error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to update settings', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
