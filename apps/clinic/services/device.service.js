/**
 * Device Management Service
 * Handles device tracking and session management
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection.js';
import Device from '@/models/Device.js';
import Session from '@/models/Session.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * Register or update device
 */
export async function registerDevice(userId, tenantId, deviceInfo) {
  await connectDB();

  const {
    deviceId,
    deviceName,
    deviceType,
    browser,
    os,
    ipAddress,
    userAgent,
    sessionToken,
    location,
  } = deviceInfo;

  const device = await Device.findOneAndUpdate(
    { userId, deviceId },
    {
      userId,
      tenantId,
      deviceId,
      deviceName,
      deviceType,
      browser,
      os,
      ipAddress,
      userAgent,
      sessionToken,
      location,
      lastActiveAt: new Date(),
      isActive: true,
    },
    { upsert: true, new: true }
  );

  return device;
}

/**
 * Get user's active devices
 */
export async function getUserDevices(userId, tenantId) {
  await connectDB();

  const devices = await Device.find(
    withTenant(tenantId, {
      userId,
      isActive: true,
    })
  ).sort({ lastActiveAt: -1 });

  return devices;
}

/**
 * Logout device remotely
 */
export async function logoutDevice(deviceId, userId, tenantId) {
  await connectDB();

  const device = await Device.findOne(
    withTenant(tenantId, {
      userId,
      deviceId,
    })
  );

  if (!device) {
    throw new Error('Device not found');
  }

  // Deactivate device
  device.isActive = false;
  await device.save();

  // Invalidate session if exists
  if (device.sessionToken) {
    await Session.findOneAndUpdate(
      { token: device.sessionToken },
      { expiresAt: new Date() }
    );
  }

  return device;
}

/**
 * Logout all devices for user
 */
export async function logoutAllDevices(userId, tenantId, excludeDeviceId = null) {
  await connectDB();

  const query = withTenant(tenantId, {
    userId,
    isActive: true,
  });

  if (excludeDeviceId) {
    query.deviceId = { $ne: excludeDeviceId };
  }

  const devices = await Device.find(query);
  const deviceIds = devices.map((d) => d.deviceId);

  // Deactivate all devices
  await Device.updateMany(query, { isActive: false });

  // Invalidate all sessions
  const sessionTokens = devices
    .map((d) => d.sessionToken)
    .filter((token) => token);

  if (sessionTokens.length > 0) {
    await Session.updateMany(
      { token: { $in: sessionTokens } },
      { expiresAt: new Date() }
    );
  }

  return { loggedOut: devices.length, deviceIds };
}

export default {
  registerDevice,
  getUserDevices,
  logoutDevice,
  logoutAllDevices,
};
