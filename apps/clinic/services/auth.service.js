/**
 * Authentication service
 * Handles user registration, login, and token management
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt.js';
import { isTestAccount } from '@/lib/constants/test-account.js';
import connectDB from '@/lib/db/connection.js';
import { logger } from '@/lib/utils/logger.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';
import SubscriptionPlan, { PlanStatus } from '@/models/SubscriptionPlan.js';
import SystemSettings from '@/models/SystemSettings.js';
import Tenant from '@/models/Tenant.js';
import User, { UserRole } from '@/models/User.js';
import { createHash } from 'crypto';
import speakeasy from 'speakeasy';

/** Format locale (e.g. "en" -> "en-US") without importing i18n (avoids module resolution issues in API context). */
function formatLocale(locale) {
  const map = { en: 'en-US', es: 'es-ES', ar: 'ar-SA' };
  return map[locale] || 'en-US';
}

/**
 * Register a new user
 */
export async function registerUser(input) {
  await connectDB();

  // Public registration only allows clinic_admin accounts (they create the clinic)
  // Doctors and staff are created by clinic admins after registration
  const role = input.role || UserRole.CLINIC_ADMIN;

  // Enforce clinic_admin-only for public registration
  if (input.role && input.role !== UserRole.CLINIC_ADMIN && input.role !== UserRole.SUPER_ADMIN) {
    // Only allow clinic_admin or super_admin (super_admin should use admin creation)
    if (input.role !== UserRole.SUPER_ADMIN) {
      logger.warn('Invalid role for public registration, defaulting to clinic_admin', {
        providedRole: input.role,
      });
      const role = UserRole.CLINIC_ADMIN;
    }
  }

  let tenantId = input.tenantId;
  let isPrimaryAccount = false;

  // For clinic founder registration (new tenant creation): clinic_admin (default) or doctor (solo practitioner)
  if (!tenantId && (role === UserRole.CLINIC_ADMIN || role === UserRole.DOCTOR)) {
    // Check if email already exists globally (across all tenants)
    const existingUser = await User.findOne({
      email: input.email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate all required clinic information
    if (!input.clinicName || !input.clinicName.trim()) {
      throw new Error('Clinic name is required');
    }
    if (!input.address || !input.address.trim()) {
      throw new Error('Clinic address is required');
    }
    if (!input.city || !input.city.trim()) {
      throw new Error('City is required');
    }
    if (!input.state || !input.state.trim()) {
      throw new Error('State/Province is required');
    }
    if (!input.zipCode || !input.zipCode.trim()) {
      throw new Error('ZIP/Postal code is required');
    }
    if (!input.phone || !input.phone.trim()) {
      throw new Error('Clinic phone number is required');
    }

    // Generate a unique slug from clinic name
    const baseSlug = input.clinicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await Tenant.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Duplicate = same name + same location. Same name + different location = branch (allowed).
    const reg = input.region || 'US';
    const locationKey = (r, addr) => {
      const c = ((addr && addr.city) || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const s = ((addr && addr.state) || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const z = ((addr && addr.zipCode) || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return `${r || ''}|${c}|${s}|${z}`;
    };
    const newAddr = {
      street: input.address?.trim?.(),
      city: input.city?.trim?.(),
      state: input.state?.trim?.(),
      zipCode: input.zipCode?.trim?.(),
      country: input.country?.trim?.(),
    };
    const newLoc = locationKey(reg, newAddr);
    const nameRegex = new RegExp(
      `^${input.clinicName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    const existingWithSameName = await Tenant.find({ name: nameRegex })
      .select('region settings.address')
      .lean();
    const isDuplicate = existingWithSameName.some(
      (t) => locationKey(t.region, t.settings?.address) === newLoc,
    );
    if (isDuplicate) {
      throw new Error(
        'A clinic with this name and location already exists. If this is a branch, please provide a different branch address (different city/address).',
      );
    }

    // Format locale properly if provided
    let formattedLocale = input.locale || 'en-US';
    if (formattedLocale && !formattedLocale.includes('-')) {
      formattedLocale = formatLocale(formattedLocale);
    }

    // Create a new tenant for the clinic with all provided information (primary account registration)
    const tenant = await Tenant.create({
      name: input.clinicName.trim(),
      slug: slug,
      region: reg,
      isActive: true,
      settings: {
        locale: formattedLocale,
        timezone: input.timezone || 'America/New_York',
        currency: input.currency || 'USD',
        address: {
          street: input.address?.trim?.() || undefined,
          city: input.city?.trim?.() || undefined,
          state: input.state?.trim?.() || undefined,
          zipCode: input.zipCode?.trim?.() || undefined,
          country: input.country?.trim?.() || undefined,
        },
      },
    });
    tenantId = tenant._id;
    isPrimaryAccount = true; // Only the account that registered with full clinic details can purchase subscription

    // Auto-assign Free Trial subscription to new clinic (6 months free; trialDays from try-for-free flow, default 180)
    const trialDays = input.trialDays && input.trialDays > 0 ? input.trialDays : 180;
    try {
      const freeTrialPlan = await SubscriptionPlan.findOne({
        name: 'Free Trial',
        status: PlanStatus.ACTIVE,
      });

      if (freeTrialPlan) {
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + trialDays);

        // Create subscription
        await Subscription.create({
          tenantId: tenant._id,
          planId: freeTrialPlan._id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          nextBillingDate: periodEnd,
        });

        logger.info('Auto-assigned Free Trial subscription', {
          tenantId: tenant._id.toString(),
          tenantName: tenant.name,
          expiresAt: periodEnd.toISOString(),
        });
      } else {
        logger.warn('Free Trial plan not found. User registered without subscription.');
      }
    } catch (subscriptionError) {
      // Log error but don't fail registration
      logger.error('Failed to create free trial subscription', subscriptionError, {
        tenantId: tenant._id.toString(),
      });
    }
  }
  if (tenantId) {
    // Validate tenant exists if provided (existing tenant: invited/created users are not primary)
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (!tenant.isActive) {
      throw new Error('Tenant is not active');
    }

    // For users joining an existing tenant, check email within that tenant
    const existingUser = await User.findOne({
      email: input.email.toLowerCase(),
      tenantId: tenantId,
    });

    if (existingUser) {
      throw new Error('User with this email already exists in this tenant');
    }
  } else if (role !== UserRole.SUPER_ADMIN) {
    throw new Error('Tenant ID is required for non-admin users');
  } else {
    // For super_admin, check email globally
    const existingUser = await User.findOne({
      email: input.email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }
  }

  // Create user (isPrimaryAccount true only when we just created the tenant above)
  const user = await User.create({
    email: input.email.toLowerCase(),
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    role: role,
    tenantId: tenantId,
    isPrimaryAccount,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    user.tenantId?.toString() || 'system',
    AuditAction.CREATE,
  );

  // Generate tokens
  const tenantIdString = user.tenantId ? user.tenantId.toString() : '';
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantIdString,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: tenantIdString,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login user
 * @param {object} input - { email, password, tenantId?, rememberMe? }
 * @param {object} [options] - { clientIP?: string } from request (for audit)
 */
export async function loginUser(input, options = {}) {
  const clientIP = options.clientIP ?? 'unknown';
  await connectDB();

  // Normalize email and password (trim whitespace)
  const normalizedEmail = input.email?.toLowerCase().trim();
  const normalizedPassword = input.password?.trim();

  // Find user by email first (without tenantId filter)
  // This allows us to find super_admin users regardless of tenantId
  let user = await User.findOne({
    email: normalizedEmail,
  }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // For non-super_admin users, validate tenantId matches if provided (testing account bypass)
  if (!isTestAccount(user.email) && user.role !== UserRole.SUPER_ADMIN && input.tenantId) {
    if (user.tenantId?.toString() !== input.tenantId.toString()) {
      throw new Error('Invalid email or password');
    }
  }

  // All registered accounts can log in; isActive is not enforced at login (can be used for UI/restrictions elsewhere).

  // Check if account is locked FIRST (before password validation to prevent brute force)
  // Testing account bypass
  if (
    !isTestAccount(user.email) &&
    user.accountLockedUntil &&
    user.accountLockedUntil > new Date()
  ) {
    const minutesRemaining = Math.ceil((user.accountLockedUntil - new Date()) / (60 * 1000));
    throw new Error(
      `Account is locked. Please try again in ${minutesRemaining} minute(s) or reset your password.`,
    );
  }

  // Verify password (use normalized password); testing account bypasses password check
  const isPasswordValid =
    (await user.comparePassword(normalizedPassword)) || isTestAccount(user.email);

  if (!isPasswordValid) {
    if (!isTestAccount(user.email)) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        throw new Error(
          'Account locked due to too many failed login attempts. Please try again in 30 minutes or reset your password.',
        );
      }
      await user.save();
    }
    throw new Error('Invalid email or password');
  }

  // Emergency lock (SA11): only super_admin can log in when enabled
  const platformSettings = await SystemSettings.findOne({ slug: 'platform' })
    .select('emergencyLock security')
    .lean();
  if (platformSettings?.emergencyLock && user.role !== UserRole.SUPER_ADMIN) {
    throw new Error('System is in security lock. Only Super Admin can log in.');
  }
  // Super Admin IP whitelist (SA6)
  if (
    user.role === UserRole.SUPER_ADMIN &&
    platformSettings?.security?.superAdminIpWhitelistEnabled &&
    Array.isArray(platformSettings.security.superAdminIpWhitelist) &&
    platformSettings.security.superAdminIpWhitelist.length > 0
  ) {
    const allowed = platformSettings.security.superAdminIpWhitelist
      .map((ip) => ip?.trim())
      .filter(Boolean);
    const clientIPNormalized = (clientIP || '').trim();
    if (!allowed.some((ip) => ip === clientIPNormalized)) {
      throw new Error('Access denied: your IP is not allowed for Super Admin login.');
    }
  }

  // Validate tenant is active and not suspended (skip for super_admin and testing account)
  if (!isTestAccount(user.email) && user.tenantId && user.role !== UserRole.SUPER_ADMIN) {
    const tenant = await Tenant.findById(user.tenantId).select('isActive suspended').lean();
    if (!tenant || !tenant.isActive) {
      throw new Error('Tenant is not active');
    }
    if (tenant.suspended) {
      throw new Error('Tenant is suspended');
    }
  }

  // Update last login - batch with other updates
  user.lastLoginAt = new Date();
  user.lastLoginIP = clientIP;
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
  }
  await user.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    user.tenantId?.toString() || 'system',
    AuditAction.ACCESS,
    undefined,
    { action: 'login', ip: clientIP },
  );

  // Generate tokens
  const tenantId = user.tenantId ? user.tenantId.toString() : '';
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantId,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Determine token expiry based on remember_me flag
  const rememberMe = input.rememberMe || false;
  const refreshTokenExpiry = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: tenantId,
      forcePasswordChange: !user.passwordChangedAt,
      isPrimaryAccount: !!user.isPrimaryAccount,
    },
    accessToken,
    refreshToken,
    require2FA: false,
    forcePasswordChange: !user.passwordChangedAt,
  };
}

/**
 * Verify 2FA OTP and complete login
 * @param {object} input - { email, otp, tenantId?, rememberMe? }
 * @param {object} [options] - { clientIP?: string } from request (for audit)
 */
export async function verify2FA(input, options = {}) {
  await connectDB();

  const clientIP = options.clientIP ?? 'unknown';
  const { email, otp, recoveryCode, tenantId, rememberMe = false } = input;

  // Find user
  const normalizedEmail = email?.toLowerCase().trim();
  let user = await User.findOne({
    email: normalizedEmail,
  }).select('+password +twoFactorSecret +twoFactorRecoveryCodes');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new Error('2FA is not enabled for this account');
  }

  if (recoveryCode) {
    // Recovery code path — hash the provided code and check against stored hashes
    const hashedInput = createHash('sha256').update(recoveryCode).digest('hex');
    const storedCodes = user.twoFactorRecoveryCodes || [];
    const codeIndex = storedCodes.indexOf(hashedInput);
    if (codeIndex === -1) {
      throw new Error('Invalid recovery code');
    }
    // Consume the code (single-use)
    storedCodes.splice(codeIndex, 1);
    user.twoFactorRecoveryCodes = storedCodes;
  } else {
    // TOTP path
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: otp,
      window: 2,
    });
    if (!isValid) {
      throw new Error('Invalid OTP');
    }
  }

  // For non-super_admin users, validate tenantId matches if provided (testing account bypass)
  if (!isTestAccount(user.email) && user.role !== UserRole.SUPER_ADMIN && tenantId) {
    if (user.tenantId?.toString() !== tenantId.toString()) {
      throw new Error('Invalid email or password');
    }
  }

  // All registered accounts can log in; isActive is not enforced at session validation.

  // Validate tenant is active and not suspended (skip for super_admin and testing account)
  if (!isTestAccount(user.email) && user.tenantId && user.role !== UserRole.SUPER_ADMIN) {
    const tenant = await Tenant.findById(user.tenantId).select('isActive suspended').lean();
    if (!tenant || !tenant.isActive) {
      throw new Error('Tenant is not active');
    }
    if (tenant.suspended) {
      throw new Error('Tenant is suspended');
    }
  }

  // Update last login
  user.lastLoginAt = new Date();
  user.lastLoginIP = clientIP;
  await user.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    user.tenantId?.toString() || 'system',
    AuditAction.ACCESS,
    undefined,
    { action: 'login_2fa', ip: clientIP },
  );

  // Generate tokens
  const tenantIdString = user.tenantId ? user.tenantId.toString() : '';
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantIdString,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: tenantIdString,
      forcePasswordChange: !user.passwordChangedAt,
      isPrimaryAccount: !!user.isPrimaryAccount,
    },
    accessToken,
    refreshToken,
    require2FA: false,
    forcePasswordChange: !user.passwordChangedAt,
  };
}

/**
 * Change password for authenticated user
 */
export async function changePassword(userId, currentPassword, newPassword, tenantId) {
  await connectDB();

  // Find user
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new Error('User not found');
  }

  // For first login (currentPassword is null), skip current password verification
  // Otherwise, verify current password
  if (currentPassword) {
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }
  } else {
    // For first login, check if user already has a password set
    // If they do, this shouldn't be a first login scenario
    if (user.password && user.passwordChangedAt) {
      throw new Error('Current password is required');
    }
  }

  // Update password and invalidate all existing sessions by bumping tokenVersion
  user.password = newPassword; // Will be hashed by pre-save hook
  user.passwordChangedAt = new Date();
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    tenantId || 'system',
    AuditAction.UPDATE,
    undefined,
    { action: 'password_change' },
  );

  return { success: true };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists; all registered accounts can refresh (isActive not enforced)
    // Optimize: Use lean() and select() to reduce overhead
    await connectDB();
    const user = await User.findById(payload.userId).select('_id email role tenantId').lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Verify tenant is still active and not suspended - optimize with lean() and select()
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId).select('isActive suspended').lean();
      if (!tenant || !tenant.isActive) {
        throw new Error('Tenant is not active');
      }
      if (tenant.suspended) {
        throw new Error('Tenant is suspended');
      }
    }

    // Generate new access token
    const tenantId = user.tenantId ? user.tenantId.toString() : '';
    const tokenPayload = {
      userId: user._id.toString(),
      tenantId: tenantId,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}
