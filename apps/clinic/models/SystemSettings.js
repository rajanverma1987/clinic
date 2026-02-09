/**
 * SystemSettings – platform-wide settings (Super Admin only).
 * Single document per slug (e.g. "platform") for general and security config.
 */

import mongoose, { Schema } from 'mongoose';

const SystemSettingsSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      default: 'platform',
    },
    general: {
      platformName: { type: String, trim: true, default: 'Clinic Tool' },
      supportEmail: { type: String, trim: true },
      supportPhone: { type: String, trim: true },
      businessHours: { type: String, trim: true },
      timezone: { type: String, trim: true, default: 'UTC' },
      dateFormat: { type: String, trim: true, default: 'MM/dd/yyyy' },
      currencyFormat: { type: String, trim: true, default: 'USD' },
    },
    security: {
      sessionTimeoutMinutes: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      passwordRequireSpecial: { type: Boolean, default: true },
      require2FAForAdmin: { type: Boolean, default: false },
      failedLoginMaxAttempts: { type: Number, default: 5 },
      failedLoginLockoutMinutes: { type: Number, default: 15 },
      ipWhitelistEnabled: { type: Boolean, default: false },
      auditLogRetentionDays: { type: Number, default: 365 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
