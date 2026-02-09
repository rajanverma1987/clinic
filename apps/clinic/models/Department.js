import mongoose, { Schema } from 'mongoose';

/**
 * Department Model
 * Manages clinic departments
 * Based on NEW-PLANS.md schema specification
 */
const DepartmentSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    headDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant + code uniqueness
DepartmentSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
