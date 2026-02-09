/**
 * Device Model
 * Tracks user devices and active sessions
 * Based on NEW-PLANS.md requirements
 */

import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sessionToken: {
      type: String,
      index: true,
    },
    location: {
      city: String,
      country: String,
      region: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
DeviceSchema.index({ userId: 1, isActive: 1 });
DeviceSchema.index({ tenantId: 1, isActive: 1 });
DeviceSchema.index({ deviceId: 1, userId: 1 }, { unique: true });

const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);

export default Device;
