import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  CLINIC_ADMIN: 'clinic_admin',
  DOCTOR: 'doctor',
  MANAGER: 'manager', // External manager account with limited access
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
  // Defensive checks
  if (!candidatePassword || typeof candidatePassword !== 'string') {
    console.error('comparePassword: Invalid candidate password provided');
    console.error('  Type:', typeof candidatePassword);
    console.error('  Value:', candidatePassword ? '***' : 'null/undefined');
    return false;
  }
  
  if (!this.password || typeof this.password !== 'string') {
    console.error('comparePassword: User has no password hash stored');
    console.error('  Password exists:', !!this.password);
    console.error('  Password type:', typeof this.password);
    return false;
  }
  
  // Check if password hash looks valid (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$') && !this.password.startsWith('$2y$')) {
    console.error('comparePassword: Password hash format is invalid');
    console.error('  Hash prefix:', this.password.substring(0, 10));
    console.error('  Hash length:', this.password.length);
    console.error('  Full hash (first 30 chars):', this.password.substring(0, 30));
    return false;
  }
  
  // Debug logging
  console.log('comparePassword: Starting comparison');
  console.log('  Candidate password length:', candidatePassword.length);
  console.log('  Stored hash length:', this.password.length);
  console.log('  Stored hash prefix:', this.password.substring(0, 7));
  console.log('  Candidate password (first 3 chars):', candidatePassword.substring(0, 3) + '***');
  
  try {
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('comparePassword: bcrypt.compare result:', result);
    
    // If false, try with trimmed password (in case of whitespace issues)
    if (!result) {
      const trimmedPassword = candidatePassword.trim();
      if (trimmedPassword !== candidatePassword) {
        console.log('comparePassword: Trying with trimmed password...');
        const trimmedResult = await bcrypt.compare(trimmedPassword, this.password);
        console.log('comparePassword: Trimmed comparison result:', trimmedResult);
        return trimmedResult;
      }
    }
    
    return result;
  } catch (error) {
    console.error('comparePassword: Error during bcrypt comparison:', error.message);
    console.error('  Error stack:', error.stack);
    return false;
  }
};

export default mongoose.models.User || mongoose.model('User', UserSchema);

