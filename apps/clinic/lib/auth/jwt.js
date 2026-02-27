import { SESSION_CONFIG } from '@/lib/constants/route-security';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production';
// Env overrides; otherwise use SESSION_CONFIG (single source of truth per CLAUDE-AI).
// Env format: '2h', '30m', '7d' (string) or seconds (number).
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? SESSION_CONFIG.accessTokenTTL;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? SESSION_CONFIG.refreshTokenTTL;

/**
 * Generate access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Generate refresh token
 * @param {object} payload - Token payload
 * @param {object} [options] - { expiresIn: number (seconds) or string (e.g. '7d') } - optional custom TTL
 */
export function generateRefreshToken(payload, options = {}) {
  const expiresIn = options.expiresIn ?? JWT_REFRESH_EXPIRES_IN;
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
