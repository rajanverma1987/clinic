import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

// CursorMD/New database-schema.mermaid: role enum "superadmin|doctor|admin|manager"
// clinic_admin = Admin in spec (kept for backward compat). Clinic staff only; no patient role.
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLINIC_ADMIN: 'clinic_admin', // Admin in spec; backward compat
  DOCTOR: 'doctor',
  MANAGER: 'manager',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  PHARMACIST: 'pharmacist',
  LAB_TECH: 'lab_tech',
};

const UserSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: function () {
        // tenantId is not required for super_admin users
        return this.role !== UserRole.SUPER_ADMIN;
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.oauthProvider;
      },
      select: false, // Don't return password by default
    },
    /** Social login: 'google' | 'apple'. When set, password is optional. */
    oauthProvider: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    /** Provider's user id (or email used as id). */
    oauthId: {
      type: String,
      trim: true,
      default: null,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    // Two-factor authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Don't return by default
    },
    twoFactorRecoveryCodes: {
      type: [String],
      select: false, // Only returned when explicitly requested
      default: undefined,
    },
    // Token version — incremented on password change to invalidate all existing tokens
    tokenVersion: {
      type: Number,
      default: 0,
    },
    // Profile information (as per NEW-PLANS.md)
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    // Login tracking
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    // Failed login attempt tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
    /** Manager only: selected access keys from MANAGER_ACCESS_OPTIONS (e.g. ['patients', 'appointments']). Empty or absent = use default manager restrictions. */
    managerAccess: {
      type: [String],
      default: undefined,
      select: true,
    },
    /** True only for the account that registered the clinic (created tenant with full details). Only this account can purchase or manage the subscription. Staff/doctors created by admin are not primary. */
    isPrimaryAccount: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for tenant + email uniqueness (sparse index to allow null tenantId for super_admin)
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
// Unique index for super_admin users (email only, no tenantId)
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { role: UserRole.SUPER_ADMIN } },
);

// Index for role-based queries
UserSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving (skip for OAuth-only users or when password not set)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== 'string') {
    return false;
  }

  if (!this.password || typeof this.password !== 'string') {
    return false;
  }

  if (
    !this.password.startsWith('$2a$') &&
    !this.password.startsWith('$2b$') &&
    !this.password.startsWith('$2y$')
  ) {
    return false;
  }

  try {
    const result = await bcrypt.compare(candidatePassword, this.password);
    if (!result) {
      const trimmedPassword = candidatePassword.trim();
      if (trimmedPassword !== candidatePassword) {
        return bcrypt.compare(trimmedPassword, this.password);
      }
    }
    return result;
  } catch (_error) {
    return false;
  }
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
