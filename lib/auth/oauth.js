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

  // Find or create user
  let user = await User.findOne({
    email: userInfo.email.toLowerCase(),
    oauthProvider: provider,
  });

  if (!user) {
    // Check if user exists with this email (link OAuth account)
    const existingUser = await User.findOne({
      email: userInfo.email.toLowerCase(),
    });

    if (existingUser) {
      // Link OAuth account to existing user
      existingUser.oauthProvider = provider;
      existingUser.oauthId = userInfo.email; // Use email as OAuth ID
      await existingUser.save();
      user = existingUser;
    } else {
      // New user registration not supported via OAuth; clinic staff register via app
      // This is a simplified version - in production, you'd need proper tenant handling
      throw new Error('OAuth registration for new users requires additional setup');
    }
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
  getOAuthUrl,
  handleOAuthCallback,
};
