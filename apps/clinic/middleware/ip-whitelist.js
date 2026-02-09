/**
 * IP Whitelist Middleware
 * Restricts admin panel access to whitelisted IPs
 * Based on NEW-PLANS.md requirements
 */

import IpWhitelist from '@/models/IpWhitelist.js';
import connectDB from '@/lib/db/connection.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * Check if IP is whitelisted
 */
async function isIpWhitelisted(ipAddress, tenantId) {
  try {
    await connectDB();

    const whitelist = await IpWhitelist.findOne({
      tenantId,
      ipAddress,
      isActive: true,
    });

    return !!whitelist;
  } catch (error) {
    logger.error('Error checking IP whitelist:', error);
    // Fail open - don't block if check fails
    return true;
  }
}

/**
 * IP whitelist middleware
 */
export function withIpWhitelist(handler) {
  return async (req, ...args) => {
    // Get user from auth middleware (should be called after withAuth)
    const user = args[0]?.user || args[0];

    // Only apply to admin routes
    if (!req.url.includes('/admin') && !req.url.includes('/settings')) {
      return handler(req, ...args);
    }

    // Only apply to admin/super_admin roles
    if (user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'clinic_admin') {
      return handler(req, ...args);
    }

    // Get client IP
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Check whitelist
    const isWhitelisted = await isIpWhitelisted(ipAddress, user.tenantId);

    if (!isWhitelisted) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Access denied. Your IP address is not whitelisted.',
            code: 'IP_NOT_WHITELISTED',
          },
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(req, ...args);
  };
}

export default withIpWhitelist;
