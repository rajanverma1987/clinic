/**
 * OAuth 2.0 Authentication
 * Supports Google and Apple Sign-In
 * Based on NEW-PLANS.md requirements
 */

import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt.js';
import connectDB from '@/lib/db/connection.js';
import User from '@/models/User.js';

/**
 * OAuth provider configuration
 */
const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    redirectUri:
      process.env.APPLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback`,
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
  },
};

/**
 * Get OAuth authorization URL
 */
export function getOAuthUrl(provider, state) {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: provider === 'google' ? 'openid email profile' : 'email name',
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
async function exchangeCodeForTokens(provider, code) {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return await response.json();
}

/**
 * Get user info from OAuth provider
 */
async function getUserInfo(provider, accessToken) {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  if (provider === 'google') {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return {
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      picture: data.picture,
    };
  }

  // Apple OAuth returns user info in the token response
  // This is a simplified version - full implementation would decode JWT
  throw new Error('Apple OAuth user info extraction not fully implemented');
}

/**
 * Handle OAuth callback and create/login user
 */
export async function handleOAuthCallback(provider, code, state) {
  await connectDB();

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(provider, code);
  const { access_token } = tokens;

  // Get user info
  const userInfo = await getUserInfo(provider, access_token);

  const emailLower = userInfo.email.toLowerCase();

  let user = await User.findOne({
    email: emailLower,
    oauthProvider: provider,
  }).lean();

  if (!user) {
    const existingUser = await User.findOne({
      email: emailLower,
    });
    if (existingUser) {
      existingUser.oauthProvider = provider;
      existingUser.oauthId = userInfo.email;
      if (!existingUser.avatar && userInfo.picture) existingUser.avatar = userInfo.picture;
      await existingUser.save();
      user = existingUser.toObject ? existingUser.toObject() : existingUser;
    } else {
      throw new Error(
        'No account found with this email. Please register with email first, then you can sign in with Google.',
      );
    }
  }

  const userId = user._id.toString();
  const tenantId = user.tenantId ? user.tenantId.toString() : '';

  const accessToken = generateAccessToken({
    userId,
    tenantId,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  });

  const refreshToken = generateRefreshToken({
    userId,
    tenantId,
    email: user.email,
    role: user.role,
    tokenVersion: (user.tokenVersion ?? 0),
  });

  return {
    user: {
      id: userId,
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId,
      isPrimaryAccount: !!user.isPrimaryAccount,
      avatar: user.avatar,
    },
    accessToken,
    refreshToken,
  };
}

export default {
  getOAuthUrl,
  handleOAuthCallback,
};
