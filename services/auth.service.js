/**
 * Authentication service
 * Handles user registration, login, and token management
 */

import connectDB from '@/lib/db/connection.js';
import User, { UserRole } from '@/models/User.js';
import Tenant from '@/models/Tenant.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import SubscriptionPlan, { PlanStatus } from '@/models/SubscriptionPlan.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';

/**
 * Register a new user
 */
export async function registerUser(input) {
  await connectDB();

  // Set default role if not provided (for public registration)
  const role = input.role || UserRole.CLINIC_ADMIN;

  let tenantId = input.tenantId;

  // If no tenantId provided and user is clinic_admin, create a new tenant
  if (!tenantId && role === UserRole.CLINIC_ADMIN) {
    // Generate a unique slug from email
    const baseSlug = input.email.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Tenant.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create a new tenant for the clinic
    const tenant = await Tenant.create({
      name: `${input.firstName} ${input.lastName}'s Clinic`,
      slug: slug,
      region: 'US', // Default region, can be updated later
      isActive: true,
      settings: {
        locale: 'en-US',
        timezone: 'America/New_York',
        currency: 'USD',
      },
    });
    tenantId = tenant._id;

    // Auto-assign Free Trial subscription to new clinic
    try {
      const freeTrialPlan = await SubscriptionPlan.findOne({ 
        name: 'Free Trial',
        status: PlanStatus.ACTIVE 
      });

      if (freeTrialPlan) {
        // Calculate 15-day trial period
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 15); // 15 days from now

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

        console.log(`✅ Auto-assigned Free Trial subscription to tenant: ${tenant.name} (expires: ${periodEnd.toISOString()})`);
      } else {
        console.warn('⚠️  Free Trial plan not found. User registered without subscription.');
      }
    } catch (subscriptionError) {
      // Log error but don't fail registration
      console.error('Failed to create free trial subscription:', subscriptionError);
    }
  } else if (tenantId) {
    // Validate tenant exists if provided
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (!tenant.isActive) {
      throw new Error('Tenant is not active');
    }
  } else if (role !== UserRole.SUPER_ADMIN) {
    throw new Error('Tenant ID is required for non-admin users');
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    email: input.email.toLowerCase(),
    ...(tenantId && { tenantId: tenantId }),
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    email: input.email.toLowerCase(),
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    role: role,
    tenantId: tenantId,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    user._id.toString(),
    user.tenantId?.toString() || 'system',
    AuditAction.CREATE
  );

  // Generate tokens
  const tenantIdString = user.tenantId ? user.tenantId.toString() : '';
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantIdString,
    email: user.email,
    role: user.role,
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
 */
export async function loginUser(input) {
  await connectDB();

  console.log('Login attempt for email:', input.email.toLowerCase());
  console.log('TenantId provided:', input.tenantId);

  // Find user by email first (without tenantId filter)
  // This allows us to find super_admin users regardless of tenantId
  let user = await User.findOne({
    email: input.email.toLowerCase(),
  }).select('+password');

  console.log('User found:', user ? {
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    isActive: user.isActive
  } : 'Not found');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // For non-super_admin users, validate tenantId matches if provided
  if (user.role !== UserRole.SUPER_ADMIN && input.tenantId) {
    if (user.tenantId?.toString() !== input.tenantId.toString()) {
      console.log('TenantId mismatch for non-super_admin user');
      throw new Error('Invalid email or password');
    }
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Validate tenant is active (skip for super_admin)
  if (user.tenantId && user.role !== UserRole.SUPER_ADMIN) {
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new Error('Tenant is not active');
    }
  }

  // Update last login
  const clientIP = 'unknown'; // TODO: Extract from request
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
    { action: 'login', ip: clientIP }
  );

  // Generate tokens
  const tenantId = user.tenantId ? user.tenantId.toString() : '';
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantId,
    email: user.email,
    role: user.role,
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
      tenantId: tenantId,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    await connectDB();
    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Verify tenant is still active
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant || !tenant.isActive) {
        throw new Error('Tenant is not active');
      }
    }

    // Generate new access token
    const tenantId = user.tenantId ? user.tenantId.toString() : '';
    const tokenPayload = {
      userId: user._id.toString(),
      tenantId: tenantId,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

