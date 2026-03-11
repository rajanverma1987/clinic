/**
 * clinic_dashboard_metrics – aggregated dashboard metrics (no live table queries).
 * Populated by update-dashboard-metrics script or dashboard stats calculation.
 * Dashboard reads ONLY from this table via getClinicSummary.
 */

import mongoose, { Schema } from 'mongoose';

const ClinicDashboardMetricsSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    today_patients: { type: Number, default: 0 },
    revenue_today: { type: Number, default: 0 },
    failed_transactions: { type: Number, default: 0 },
    pending_appointments: { type: Number, default: 0 },
    active_staff: { type: Number, default: 0 },
    /** Full snapshot for dashboard UI (appointments breakdown, queue, etc.) */
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updated_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'clinic_dashboard_metrics',
  },
);

ClinicDashboardMetricsSchema.index({ updated_at: 1 });

export default mongoose.models.ClinicDashboardMetrics ||
  mongoose.model('ClinicDashboardMetrics', ClinicDashboardMetricsSchema);
