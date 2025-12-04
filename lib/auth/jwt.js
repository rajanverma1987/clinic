import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production';
// Default to 2 hours for access token (configurable via JWT_EXPIRES_IN env var)
// Format: '2h', '30m', '1d', etc.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
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

