/**
 * IP Whitelist Model
 * Manages IP whitelist for admin panel
 * Based on NEW-PLANS.md requirements
 */

import mongoose from 'mongoose';

const IpWhitelistSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
IpWhitelistSchema.index({ tenantId: 1, ipAddress: 1 }, { unique: true });

const IpWhitelist = mongoose.models.IpWhitelist || mongoose.model('IpWhitelist', IpWhitelistSchema);

export default IpWhitelist;
