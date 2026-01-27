import mongoose, { Schema } from 'mongoose';

/**
 * Doctor Model
 * Extended profile for doctors with professional information
 * Based on NEW-PLANS.md schema specification
 */
const DoctorSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false, // optional for pending self-registered doctors; assigned on admin approval
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Professional information
    professional: {
      licenseNumber: {
        type: String,
        trim: true,
        index: true,
      },
      specialization: [{
        type: String,
        trim: true,
      }],
      qualification: {
        type: String,
        trim: true,
      },
      experienceYears: {
        type: Number,
        min: 0,
      },
      languages: [{
        type: String,
        trim: true,
      }],
    },
    // Schedule configuration
    schedule: {
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      slots: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: String, // Format: "HH:mm"
        endTime: String, // Format: "HH:mm"
        slotDuration: {
          type: Number,
          default: 30, // minutes
        },
      }],
      leaves: [{
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
          required: true,
        },
        reason: {
          type: String,
          trim: true,
        },
      }],
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    departments: [{
      type: Schema.Types.ObjectId,
      ref: 'Department',
    }],
    bio: {
      type: String,
      trim: true,
    },
    signature: {
      type: String, // Base64 encoded signature image
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive'],
      default: 'active',
      index: true,
    },
    // Admin verification (dp-6: Doctor Registration – Admin Verification)
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationComment: { type: String, trim: true },
    verificationReviewedAt: { type: Date },
    uploadedDocuments: [{
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      type: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant + user
DoctorSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
DoctorSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
