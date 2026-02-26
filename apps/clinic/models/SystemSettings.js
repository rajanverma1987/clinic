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
    tax: {
      defaultTaxType: { type: String, enum: ['GST', 'VAT', 'SALES_TAX', 'NONE'], default: 'NONE' },
      defaultTaxRate: { type: Number, default: 0, min: 0, max: 100 },
      defaultCountry: { type: String, trim: true, default: '' },
    },
    currency: {
      defaultCurrency: { type: String, trim: true, default: 'USD' },
      supportedCurrencies: { type: [String], default: ['USD', 'EUR', 'GBP', 'INR'] },
    },
    smtp: {
      host: { type: String, trim: true },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, trim: true },
      password: { type: String, trim: true },
      fromEmail: { type: String, trim: true },
      fromName: { type: String, trim: true },
    },
    sms: {
      twilioAccountSid: { type: String, trim: true },
      twilioAuthToken: { type: String, trim: true },
      twilioPhoneNumber: { type: String, trim: true },
    },
    content: {
      terms: { type: String, trim: true },
      privacy: { type: String, trim: true },
    },
    maintenanceMode: { type: Boolean, default: false },
    /** When true, only super_admin can log in (emergency security lock). */
    emergencyLock: { type: Boolean, default: false },
    security: {
      sessionTimeoutMinutes: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      passwordRequireSpecial: { type: Boolean, default: true },
      require2FAForAdmin: { type: Boolean, default: false },
      failedLoginMaxAttempts: { type: Number, default: 5 },
      failedLoginLockoutMinutes: { type: Number, default: 15 },
      ipWhitelistEnabled: { type: Boolean, default: false },
      /** IPs allowed for Super Admin login when superAdminIpWhitelistEnabled is true. */
      superAdminIpWhitelistEnabled: { type: Boolean, default: false },
      superAdminIpWhitelist: { type: [String], default: [] },
      auditLogRetentionDays: { type: Number, default: 365 },
    },
  },
  { timestamps: true },
);

export default mongoose.models.SystemSettings ||
  mongoose.model('SystemSettings', SystemSettingsSchema);
