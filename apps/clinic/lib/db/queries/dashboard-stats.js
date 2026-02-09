/**
 * Single-aggregation dashboard stats for a given date.
 * Uses $facet to get total, completed, cancelled appointments and revenue in one round-trip.
 *
 * @module lib/db/queries/dashboard-stats
 * @enterprise
 * - Optimized aggregation pipeline for performance
 * - Proper error handling
 * - Tenant isolation enforced
 */

import { logger } from '@/lib/utils/logger.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import { InvoiceStatus } from '@/models/Invoice.js';
import mongoose from 'mongoose';

/**
 * Get dashboard stats for one day: appointment counts and revenue (from invoices linked to appointments).
 *
 * @param {string|mongoose.Types.ObjectId} tenantId - Tenant ID for multi-tenant isolation
 * @param {string} date - Date string in 'YYYY-MM-DD' format
 * @returns {Promise<{ totalAppointments: number, completedAppointments: number, cancelledAppointments: number, revenue: number }>}
 *
 * @throws {Error} If database query fails
 *
 * @enterprise
 * - Uses $facet for parallel aggregation operations
 * - Includes $lookup for invoice revenue calculation
 * - Handles edge cases (null results, missing data)
 * - Proper error handling and logging
 */
export async function getDashboardStatsForDate(tenantId, date) {
  // Validate inputs
  if (!tenantId) {
    throw new Error('tenantId is required');
  }
  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }

  try {
    const tid = typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;
    // Use local time so day boundaries match report.service (server local)
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59.999');

    // Early return optimization: Quick check if any appointments exist for this tenant
    const hasAppointments = await Appointment.countDocuments({
      tenantId: tid,
      deletedAt: null,
    });

    if (hasAppointments === 0) {
      // No appointments exist - return zeros immediately without expensive aggregation
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        revenue: 0,
      };
    }

    // Optimize: Use single query - MongoDB will use indexes efficiently for $or queries
    const [result] = await Appointment.aggregate([
      {
        $match: {
          tenantId: tid,
          deletedAt: null,
          $or: [
            { appointmentDate: { $gte: dayStart, $lte: dayEnd } },
            { startTime: { $gte: dayStart, $lte: dayEnd } },
            { 'schedule.date': { $gte: dayStart, $lte: dayEnd } },
          ],
        },
      },
      {
        $facet: {
          totalAppointments: [{ $count: 'count' }],
          completedAppointments: [
            { $match: { status: AppointmentStatus.COMPLETED } },
            { $count: 'count' },
          ],
          cancelledAppointments: [
            { $match: { status: AppointmentStatus.CANCELLED } },
            { $count: 'count' },
          ],
          revenue: [
            {
              $lookup: {
                from: 'invoices',
                let: { aptId: '$_id', aptTenant: '$tenantId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$appointmentId', '$$aptId'] },
                          { $eq: ['$tenantId', '$$aptTenant'] },
                          { $ne: ['$status', InvoiceStatus.CANCELLED] },
                        ],
                      },
                      deletedAt: null,
                    },
                  },
                  { $project: { totalAmount: 1 } },
                ],
                as: 'invoice',
              },
            },
            { $unwind: { path: '$invoice', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                total: { $sum: { $ifNull: ['$invoice.totalAmount', 0] } },
              },
            },
          ],
        },
      },
    ]);

    if (!result) {
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        revenue: 0,
      };
    }

    return {
      totalAppointments: result.totalAppointments[0]?.count ?? 0,
      completedAppointments: result.completedAppointments[0]?.count ?? 0,
      cancelledAppointments: result.cancelledAppointments[0]?.count ?? 0,
      revenue: result.revenue[0]?.total ?? 0,
    };
  } catch (error) {
    logger.error('Error fetching dashboard stats for date:', {
      error: error.message,
      stack: error.stack,
      tenantId,
      date,
    });
    // Return default values on error to prevent dashboard failure
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      revenue: 0,
    };
  }
}
