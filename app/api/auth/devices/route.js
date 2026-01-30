/**
 * Device Management API
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse } from '@/lib/utils/api-response';
import { getUserDevices, logoutDevice, logoutAllDevices } from '@/services/device.service';

/**
 * GET /api/auth/devices
 * Get user's active devices
 */
async function getHandler(req, user) {
  const devices = await getUserDevices(user.userId, user.tenantId);

  return NextResponse.json(successResponse(devices));
}

/**
 * DELETE /api/auth/devices?deviceId=xxx
 * Logout specific device
 */
async function deleteHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get('deviceId');
  const all = searchParams.get('all') === 'true';

  if (all) {
    const result = await logoutAllDevices(user.userId, user.tenantId);
    return NextResponse.json(successResponse(result));
  }

  if (!deviceId) {
    return NextResponse.json(
      { success: false, error: { message: 'Device ID is required' } },
      { status: 400 }
    );
  }

  await logoutDevice(deviceId, user.userId, user.tenantId);

  return NextResponse.json(successResponse({ message: 'Device logged out successfully' }));
}

export const GET = withErrorHandler(withAuth(getHandler));
export const DELETE = withErrorHandler(withAuth(deleteHandler));
