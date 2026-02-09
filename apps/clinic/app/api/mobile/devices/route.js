/**
 * Mobile API - Device Registration
 * Register FCM token for push notifications
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { registerDevice } from '@/services/device.service';
import { z } from 'zod';

const registerDeviceSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
  fcmToken: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

/**
 * POST /api/mobile/devices
 * Register device for push notifications
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = registerDeviceSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const device = await registerDevice(user.userId, user.tenantId, {
    ...validationResult.data,
    ipAddress,
    userAgent,
  });

  return NextResponse.json(successResponse(device), { status: 201 });
}

export const POST = withErrorHandler(withAuth(postHandler));
