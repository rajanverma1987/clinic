#!/usr/bin/env node
/**
 * update-dashboard-metrics – background aggregator.
 * Pulls from raw tables, calculates daily stats, updates clinic_dashboard_metrics.
 * Run via cron every 1 minute: * * * * * node apps/clinic/scripts/update-dashboard-metrics.js
 */

import 'dotenv/config';
import { createRequire } from 'module';
import connectDB from '../lib/db/connection.js';
import Tenant from '../models/Tenant.js';
import ClinicDashboardMetrics from '../models/ClinicDashboardMetrics.js';

const require = createRequire(import.meta.url);
const { calculateDashboardStats } = require('../jobs/dashboard-stats.js');

async function pullRawStatsForMetrics(tenantId) {
  const stats = await calculateDashboardStats(tenantId);
  if (!stats) return null;

  const todayPaid = stats.revenue?.today?.paid ?? stats.revenue?.today?.total ?? 0;
  const pending = stats.appointments?.todayTotal ?? 0;
  const totalPatients = stats.patients?.total ?? 0;
  const activePatients = stats.patients?.active ?? 0;

  return {
    todayPatients: totalPatients,
    revenueToday: typeof todayPaid === 'number' ? todayPaid : 0,
    failedTransactions: 0,
    pendingAppointments: pending,
    activeStaff: 0,
    data: {
      appointments: stats.appointments || {},
      revenue: stats.revenue || {},
      patients: stats.patients || {},
      queue: stats.queue || {},
      lastUpdated: stats.lastUpdated,
      timestamp: stats.timestamp,
    },
  };
}

async function run() {
  try {
    await connectDB();
    const tenants = await Tenant.find({ isActive: true }).select('_id').lean();

    for (const t of tenants) {
      const tenantId = t._id?.toString?.() || t._id;
      const raw = await pullRawStatsForMetrics(tenantId);
      if (!raw) continue;

      const metrics = {
        tenantId,
        today_patients: raw.todayPatients ?? 0,
        revenue_today: raw.revenueToday ?? 0,
        failed_transactions: raw.failedTransactions ?? 0,
        pending_appointments: raw.pendingAppointments ?? 0,
        active_staff: raw.activeStaff ?? 0,
        data: raw.data ?? {},
        updated_at: new Date(),
      };

      await ClinicDashboardMetrics.findOneAndUpdate(
        { tenantId },
        { $set: metrics },
        { upsert: true, new: true },
      );
    }

    process.exit(0);
  } catch (err) {
    console.error('update-dashboard-metrics error:', err);
    process.exit(1);
  }
}

run();
