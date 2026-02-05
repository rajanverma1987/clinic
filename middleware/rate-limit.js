/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse.
 * Uses route-specific RATE_LIMITS from route-security when path matches; otherwise built-in presets.
 */

import { RATE_LIMITS as ROUTE_RATE_LIMITS } from '@/lib/constants/route-security';
import { errorResponse } from '@/lib/utils/api-response';
import { NextResponse } from 'next/server';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

/** Parse window string to ms: '15m' -> 900000, '1h' -> 3600000 */
function parseWindow(windowStr) {
  if (!windowStr) return 60 * 1000;
  const m = String(windowStr)
    .trim()
    .match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || 'm').toLowerCase();
  const mult = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return n * (mult[unit] ?? mult.m);
}

/**
 * Built-in rate limit presets (used when no route-specific limit in route-security)
 */
const RATE_LIMITS = {
  public: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 1 * 60 * 1000, max: 60 },
  strict: { windowMs: 1 * 60 * 1000, max: 10 },
};

/**
 * Get client identifier for rate limiting
 */
function getClientId(req) {
  // Try to get user ID first (for authenticated requests)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      const token = authHeader.substring(7);
      const { verifyAccessToken } = require('@/lib/auth/jwt.js');
      const user = verifyAccessToken(token);
      return `user:${user.userId}`;
    } catch (e) {
      // Token invalid, fall through to IP-based
    }
  }

  // Fall back to IP address
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Clean up expired entries from rate limit store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStore, 5 * 60 * 1000);
}

/**
 * Rate limit middleware factory.
 * For preset 'auth', if request path matches ROUTE_RATE_LIMITS (e.g. /api/auth/login), use that config.
 */
export function rateLimit(config = 'api') {
  return (handler) => {
    return async (req, ...args) => {
      let limitConfig =
        typeof config === 'string' ? RATE_LIMITS[config] || RATE_LIMITS.api : config;
      const pathname = new URL(req.url || 'http://x', 'http://x').pathname;
      const routeLimit = ROUTE_RATE_LIMITS[pathname];
      if (routeLimit) {
        limitConfig = { windowMs: parseWindow(routeLimit.window), max: routeLimit.max };
      }
      const clientId = getClientId(req);
      const key = `${config}:${pathname}:${clientId}`;
      const now = Date.now();

      // Cleanup old entries periodically
      if (Math.random() < 0.01) {
        // 1% chance to cleanup
        cleanupStore();
      }

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry || entry.resetTime < now) {
        // Create new window
        entry = {
          count: 0,
          resetTime: now + limitConfig.windowMs,
        };
        rateLimitStore.set(key, entry);
      }

      // Increment count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > limitConfig.max) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

        return NextResponse.json(
          errorResponse(
            `Too many requests. Please try again after ${retryAfter} seconds.`,
            'RATE_LIMIT_EXCEEDED',
            { retryAfter, limit: limitConfig.max, windowMs: limitConfig.windowMs },
          ),
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(limitConfig.max),
              'X-RateLimit-Remaining': String(Math.max(0, limitConfig.max - entry.count)),
              'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
            },
          },
        );
      }

      // Add rate limit headers
      const response = await handler(req, ...args);

      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', String(limitConfig.max));
        response.headers.set(
          'X-RateLimit-Remaining',
          String(Math.max(0, limitConfig.max - entry.count)),
        );
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
      }

      return response;
    };
  };
}

/**
 * Pre-configured rate limiters
 */
export const publicRateLimit = rateLimit('public');
export const authRateLimit = rateLimit('auth');
export const apiRateLimit = rateLimit('api');
export const strictRateLimit = rateLimit('strict');
