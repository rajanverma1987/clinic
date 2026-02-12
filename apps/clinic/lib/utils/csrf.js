/**
 * CSRF Token Utilities
 * Generates and validates CSRF tokens for state-mutating API requests.
 * Token is stored in an httpOnly cookie and echoed back in the X-CSRF-Token header.
 */

import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-fallback-secret';
const TOKEN_LENGTH = 32; // bytes → 64 hex chars

/**
 * Generate a signed CSRF token.
 * Format: <random_hex>.<hmac_signature>
 */
export function generateCsrfToken() {
  const random = randomBytes(TOKEN_LENGTH).toString('hex');
  const sig = createHmac('sha256', CSRF_SECRET).update(random).digest('hex');
  return `${random}.${sig}`;
}

/**
 * Validate a CSRF token by re-computing the HMAC.
 * @param {string} token
 * @returns {boolean}
 */
export function validateCsrfToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [random, sig] = token.split('.');
  if (!random || !sig) return false;
  const expected = createHmac('sha256', CSRF_SECRET).update(random).digest('hex');
  return expected === sig;
}

/**
 * Extract the CSRF token from an incoming Next.js request.
 * Reads from: X-CSRF-Token header first, then falls back to x-xsrf-token.
 * @param {Request} req
 * @returns {string|null}
 */
export function getCsrfTokenFromRequest(req) {
  return (
    req.headers.get('x-csrf-token') ||
    req.headers.get('x-xsrf-token') ||
    null
  );
}

/**
 * Cookie name used to store/read the CSRF token on the client.
 */
export const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Cookie options for the CSRF token cookie.
 * SameSite=Strict + httpOnly=false so JS can read it and put it in the header.
 */
export const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,        // Must be readable by JS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24,  // 24 hours
  path: '/',
};
