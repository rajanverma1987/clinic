/**
 * Magic Link Authentication
 * Passwordless login via email magic link
 * Based on NEW-PLANS.md requirements
 */

import crypto from 'crypto';
import User from '@/models/User.js';
import connectDB from '@/lib/db/connection.js';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt.js';
import { sendEmail } from '@/lib/email/email-service.js';

const MAGIC_LINK_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MAGIC_LINK_SECRET = process.env.MAGIC_LINK_SECRET || process.env.JWT_SECRET;

/**
 * Generate magic link token
 */
function generateMagicLinkToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + MAGIC_LINK_EXPIRY;
  
  // Create signed token
  const data = `${email}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', MAGIC_LINK_SECRET)
    .update(data)
    .digest('hex');
  
  return `${token}:${expiresAt}:${signature}`;
}

/**
 * Verify magic link token
 */
function verifyMagicLinkToken(token, email) {
  try {
    const [tokenPart, expiresAtStr, signature] = token.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    const data = `${email}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', MAGIC_LINK_SECRET)
      .update(data)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLink(email) {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists (security best practice)
    return { success: true, message: 'If an account exists, a magic link has been sent' };
  }

  const token = generateMagicLinkToken(email);
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  // Send email
  await sendEmail({
    to: email,
    subject: 'Your Magic Link Login',
    html: `
      <h2>Magic Link Login</h2>
      <p>Click the link below to log in (expires in 10 minutes):</p>
      <p><a href="${magicLink}">${magicLink}</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  return { success: true, message: 'Magic link sent' };
}

/**
 * Verify magic link and login
 */
export async function verifyMagicLink(token, email) {
  await connectDB();

  const verification = verifyMagicLinkToken(token, email);
  if (!verification.valid) {
    throw new Error(verification.error || 'Invalid magic link');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'active') {
    throw new Error('Account is not active');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    tenantId: user.tenantId?.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    tenantId: user.tenantId?.toString(),
  });

  return {
    user: {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export default {
  sendMagicLink,
  verifyMagicLink,
};
