import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  CLINIC_ADMIN: 'clinic_admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  ACCOUNTANT: 'accountant',
  PHARMACIST: 'pharmacist',
};

const UserSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: function() {
        // tenantId is not required for super_admin users
        return this.role !== UserRole.SUPER_ADMIN;
      },
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
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
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    lastLoginIP: String,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant + email uniqueness (sparse index to allow null tenantId for super_admin)
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
// Unique index for super_admin users (email only, no tenantId)
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { role: UserRole.SUPER_ADMIN } });

// Index for role-based queries
UserSchema.index({ tenantId: 1, role: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
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
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);

