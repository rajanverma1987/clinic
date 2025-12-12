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

  // Public registration only allows clinic_admin accounts (they create the clinic)
  // Doctors and staff are created by clinic admins after registration
  const role = input.role || UserRole.CLINIC_ADMIN;
  
  // Enforce clinic_admin-only for public registration
  if (input.role && input.role !== UserRole.CLINIC_ADMIN && input.role !== UserRole.SUPER_ADMIN) {
    // Only allow clinic_admin or super_admin (super_admin should use admin creation)
    if (input.role !== UserRole.SUPER_ADMIN) {
      console.warn(`Invalid role ${input.role} for public registration, defaulting to clinic_admin`);
      const role = UserRole.CLINIC_ADMIN;
    }
  }

  let tenantId = input.tenantId;

  // For clinic_admin registration (new tenant creation), check email globally first
  if (!tenantId && role === UserRole.CLINIC_ADMIN) {
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

    // Format locale properly if provided
    let formattedLocale = input.locale || 'en-US';
    if (formattedLocale && !formattedLocale.includes('-')) {
      // If locale is just language code (e.g., 'en'), format it properly
      const { formatLocale } = await import('@/lib/i18n/index.js');
      formattedLocale = formatLocale(formattedLocale);
    }

    // Create a new tenant for the clinic with all provided information
    const tenant = await Tenant.create({
      name: input.clinicName.trim(),
      slug: slug,
      region: input.region || 'US',
      isActive: true,
      settings: {
        locale: formattedLocale,
        timezone: input.timezone || 'America/New_York',
        currency: input.currency || 'USD',
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

  // Normalize email and password (trim whitespace)
  const normalizedEmail = input.email?.toLowerCase().trim();
  const normalizedPassword = input.password?.trim();

  console.log('Login attempt for email:', normalizedEmail);
  console.log('TenantId provided:', input.tenantId);
  console.log('Password received length:', normalizedPassword?.length || 0);
  console.log('Password received (first 3 chars):', normalizedPassword ? normalizedPassword.substring(0, 3) + '***' : 'N/A');

  // Find user by email first (without tenantId filter)
  // This allows us to find super_admin users regardless of tenantId
  let user = await User.findOne({
    email: normalizedEmail,
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

  // Verify password (use normalized password)
  console.log('Verifying password...');
  console.log('Password provided length:', normalizedPassword?.length || 0);
  console.log('User password hash exists:', !!user.password);
  console.log('User password hash length:', user.password?.length || 0);
  console.log('User password hash prefix:', user.password ? user.password.substring(0, 7) : 'N/A');
  console.log('User role:', user.role);
  console.log('User is super_admin:', user.role === UserRole.SUPER_ADMIN);
  
  const isPasswordValid = await user.comparePassword(normalizedPassword);
  console.log('Password validation result:', isPasswordValid);
  
  if (!isPasswordValid) {
    console.error('Password validation failed for user:', user.email);
    console.error('User role:', user.role);
    // Check if password hash is valid
    if (!user.password || user.password.length < 10) {
      console.error('WARNING: User password hash appears invalid or missing!');
      console.error('Hash length:', user.password?.length || 0);
    } else if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
      console.error('WARNING: Password hash format is invalid!');
      console.error('Hash starts with:', user.password.substring(0, 10));
      console.error('Expected format: $2a$, $2b$, or $2y$');
      console.error('This user may need to reset their password.');
    }
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

