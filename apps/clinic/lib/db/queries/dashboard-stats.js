/**
 * Single-aggregation dashboard stats for a given date.
 * Uses $facet to get total, completed, cancelled appointments and revenue in one round-trip.
 */

import mongoose from 'mongoose';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import { InvoiceStatus } from '@/models/Invoice.js';

/**
 * Get dashboard stats for one day: appointment counts and revenue (from invoices linked to appointments).
 *
 * @param {string|mongoose.Types.ObjectId} tenantId
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Promise<{ totalAppointments: number, completedAppointments: number, cancelledAppointments: number, revenue: number }>}
 */
export async function getDashboardStatsForDate(tenantId, date) {
  const tid =
    typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId;
  // Use local time so day boundaries match report.service (server local)
  const dayStart = new Date(date + 'T00:00:00');
  const dayEnd = new Date(date + 'T23:59:59.999');

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
}
