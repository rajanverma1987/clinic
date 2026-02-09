/**
 * IP Whitelist Management API
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import IpWhitelist from '@/models/IpWhitelist.js';
import { z } from 'zod';

const addIpSchema = z.object({
  ipAddress: z.string().ip(),
  description: z.string().optional(),
});

/**
 * GET /api/admin/ip-whitelist
 * Get whitelisted IPs
 */
async function getHandler(req, user) {
  await connectDB();

  const whitelist = await IpWhitelist.find({
    tenantId: user.tenantId,
    isActive: true,
  }).sort({ createdAt: -1 });

  return NextResponse.json(successResponse(whitelist));
}

/**
 * POST /api/admin/ip-whitelist
 * Add IP to whitelist
 */
async function postHandler(req, user) {
  await connectDB();

  const body = await req.json();
  const validationResult = addIpSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const ipWhitelist = await IpWhitelist.create({
    tenantId: user.tenantId,
    ipAddress: validationResult.data.ipAddress,
    description: validationResult.data.description,
    addedBy: user.userId,
    isActive: true,
  });

  return NextResponse.json(successResponse(ipWhitelist), { status: 201 });
}

/**
 * DELETE /api/admin/ip-whitelist?id=xxx
 * Remove IP from whitelist
 */
async function deleteHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: { message: 'ID is required' } },
      { status: 400 }
    );
  }

  await IpWhitelist.findOneAndUpdate(
    { _id: id, tenantId: user.tenantId },
    { isActive: false }
  );

  return NextResponse.json(successResponse({ message: 'IP removed from whitelist' }));
}

export const GET = withErrorHandler(
  withAuth(
    requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler)
  )
);

export const POST = withErrorHandler(
  withAuth(
    requirePermission(RESOURCES.SETTINGS, ACTIONS.CREATE)(postHandler)
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    requirePermission(RESOURCES.SETTINGS, ACTIONS.DELETE)(deleteHandler)
  )
);
