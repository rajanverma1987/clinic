/**
 * Authentication service
 * Handles user registration, login, and token management
 */

import connectDB from '@/lib/db/connection';
import User, { IUser, UserRole } from '@/models/User';
import Tenant from '@/models/Tenant';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from '@/lib/auth/jwt';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';
import { RegisterInput, LoginInput } from '@/lib/validations/auth';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 */
export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  await connectDB();

  // Set default role if not provided (for public registration)
  const role = input.role || UserRole.CLINIC_ADMIN;

  let tenantId: any = input.tenantId;

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
    tenantId: tenantId!,
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
  const tokenPayload: JWTPayload = {
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
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  await connectDB();

  // Find user by email
  const user = await User.findOne({
    email: input.email.toLowerCase(),
    ...(input.tenantId && { tenantId: input.tenantId }),
  }).select('+password'); // Include password field

  if (!user) {
    throw new Error('Invalid email or password');
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

  // Validate tenant is active
  if (user.tenantId) {
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
  const tokenPayload: JWTPayload = {
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
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
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
    const tokenPayload: JWTPayload = {
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

