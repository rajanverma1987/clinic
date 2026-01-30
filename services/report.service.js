/**
 * Reporting service
 * Handles all reporting and analytics business logic
 */

import { AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { logger } from '@/lib/utils/logger.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import ClinicalNote from '@/models/ClinicalNote.js';
import Department from '@/models/Department.js';
import Doctor from '@/models/Doctor.js';
import InventoryItem from '@/models/InventoryItem.js';
import Invoice, { InvoiceStatus } from '@/models/Invoice.js';
import Patient from '@/models/Patient.js';
import Payment, { PaymentStatus } from '@/models/Payment.js';
import StockTransaction from '@/models/StockTransaction.js';

/**
 * Build date filter for queries
 */
function buildDateFilter(startDate, endDate) {
  const filter = {};
  if (startDate || endDate) {
    filter.$gte = startDate ? new Date(startDate) : new Date(0);
    filter.$lte = endDate ? new Date(endDate) : new Date();
  }
  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Group data by time period
 */
function groupByTimePeriod(data, groupBy) {
  const grouped = {};

  if (!data || !Array.isArray(data) || data.length === 0) {
    return grouped;
  }

  data.forEach((item) => {
    if (!item || !item.date) return;

    try {
      const date = new Date(item.date);

      // Validate date
      if (isNaN(date.getTime())) {
        logger.warn('Invalid date in groupByTimePeriod:', item.date);
        return;
      }

      let key;

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, count: 0, total: 0 };
      }

      grouped[key].count += item.count || 1;
      grouped[key].total += item.total || item.amount || 0;
    } catch (err) {
      logger.error('Error processing date in groupByTimePeriod:', err, item);
      // Skip invalid items
    }
  });

  return grouped;
}

/**
 * Revenue Analytics Report
 */
export async function getRevenueReport(input, tenantId, userId) {
  await connectDB();

  const dateFilter = buildDateFilter(input.startDate, input.endDate);
  const filter = withTenant(tenantId, {
    deletedAt: null,
    status: { $ne: InvoiceStatus.CANCELLED },
  });

  if (dateFilter) {
    filter.invoiceDate = dateFilter;
  }

  if (input.doctorId) {
    // Filter by appointments linked to invoices
    filter.appointmentId = { $exists: true };
  }

  if (input.status) {
    filter.status = input.status;
  }

  // Get invoices - optimized with lean() and selective population
  const invoices = await Invoice.find(filter)
    .populate('patientId', 'firstName lastName')
    .populate('appointmentId', 'doctorId startTime')
    .select('invoiceDate totalAmount balanceAmount status appointmentId patientId')
    .lean();

  // Filter by doctor if specified (through appointments)
  let filteredInvoices = invoices;
  if (input.doctorId) {
    filteredInvoices = invoices.filter((inv) => {
      const appointment = inv.appointmentId;
      return appointment && appointment.doctorId?.toString() === input.doctorId;
    });
  }

  // Get payments
  const paymentFilter = withTenant(tenantId, {
    deletedAt: null,
    status: PaymentStatus.COMPLETED,
  });

  if (dateFilter) {
    paymentFilter.paymentDate = dateFilter;
  }

  if (input.paymentMethod) {
    paymentFilter.paymentMethod = input.paymentMethod;
  }

  const payments = await Payment.find(paymentFilter).lean();

  // Calculate totals
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const totalPending = filteredInvoices
    .filter((inv) => inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.PARTIAL)
    .reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

  // Payment method breakdown
  const paymentMethodBreakdown = {};
  payments.forEach((pay) => {
    const method = pay.paymentMethod || 'unknown';
    paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (pay.amount || 0);
  });

  // Invoice status breakdown
  const statusBreakdown = {};
  filteredInvoices.forEach((inv) => {
    const status = inv.status || 'unknown';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  });

  // Time series data
  let timeSeries = [];
  if (input.groupBy) {
    try {
      const timeData = filteredInvoices
        .filter((inv) => inv.invoiceDate) // Only include invoices with valid dates
        .map((inv) => {
          try {
            const date = new Date(inv.invoiceDate);
            if (isNaN(date.getTime())) return null;
            return {
              date: inv.invoiceDate,
              amount: inv.totalAmount || 0,
              total: inv.totalAmount || 0,
              count: 1,
            };
          } catch (e) {
            return null;
          }
        })
        .filter((item) => item !== null); // Remove null entries

      if (timeData.length > 0) {
        timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
      }
    } catch (err) {
      logger.error('Error generating revenue time series:', err);
      timeSeries = [];
    }
  }

  await AuditLogger.auditRead('report', 'revenue', userId, tenantId);

  return {
    summary: {
      totalRevenue,
      totalPaid,
      totalPending,
      invoiceCount: filteredInvoices.length,
      paymentCount: payments.length,
    },
    breakdown: input.includeBreakdown
      ? {
          paymentMethods: paymentMethodBreakdown,
          statuses: statusBreakdown,
        }
      : undefined,
    timeSeries: input.groupBy ? timeSeries : undefined,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

/**
 * Patient Analytics Report
 */
export async function getPatientReport(input, tenantId, userId) {
  try {
    await connectDB();

    // Validate tenantId
    if (!tenantId) {
      logger.warn('getPatientReport called without tenantId');
      return {
        summary: { totalPatients: 0 },
        breakdown: { gender: {}, ageGroups: {}, bloodGroups: {} },
        timeSeries: input.groupBy ? [] : undefined,
        period: { startDate: input.startDate, endDate: input.endDate },
      };
    }

    let dateFilter;
    try {
      dateFilter = buildDateFilter(input.startDate, input.endDate);
    } catch (err) {
      logger.error('Error building date filter:', err);
      dateFilter = null;
    }

    const filter = withTenant(tenantId, {
      deletedAt: null,
    });

    // Get all patients - optimized with field selection
    let allPatients = [];
    try {
      allPatients = await Patient.find(filter)
        .select('gender dateOfBirth bloodGroup createdAt')
        .lean();
    } catch (err) {
      logger.error('Error fetching patients:', err);
      allPatients = [];
    }

    // Filter by date if provided (for new patients)
    let patients = allPatients;
    if (input.includeNewPatients && dateFilter) {
      try {
        const startDate = dateFilter.$gte ? new Date(dateFilter.$gte) : null;
        const endDate = dateFilter.$lte ? new Date(dateFilter.$lte) : null;

        if (startDate && endDate) {
          patients = allPatients.filter((p) => {
            if (!p.createdAt) return false;
            try {
              const created = new Date(p.createdAt);
              if (isNaN(created.getTime())) return false;
              return created >= startDate && created <= endDate;
            } catch (e) {
              return false;
            }
          });
        }
      } catch (err) {
        logger.error('Error filtering patients by date:', err);
        // Continue with all patients if date filtering fails
      }
    }

    // Gender breakdown
    const genderBreakdown = {};
    patients.forEach((p) => {
      const gender = p.gender || 'unknown';
      genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;
    });

    // Age group breakdown
    const ageGroups = {
      '0-18': 0,
      '19-30': 0,
      '31-50': 0,
      '51-70': 0,
      '71+': 0,
    };

    const now = new Date();
    patients.forEach((p) => {
      if (!p.dateOfBirth) return;
      try {
        const dob = new Date(p.dateOfBirth);
        if (isNaN(dob.getTime())) return;
        const age = now.getFullYear() - dob.getFullYear();
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 30) ageGroups['19-30']++;
        else if (age <= 50) ageGroups['31-50']++;
        else if (age <= 70) ageGroups['51-70']++;
        else ageGroups['71+']++;
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Blood group breakdown
    const bloodGroupBreakdown = {};
    patients.forEach((p) => {
      if (p.bloodGroup) {
        bloodGroupBreakdown[p.bloodGroup] = (bloodGroupBreakdown[p.bloodGroup] || 0) + 1;
      }
    });

    // Time series data for charts (used by dashboard)
    let timeSeries = [];
    if (input.groupBy) {
      try {
        const timeData = patients
          .filter((p) => p.createdAt) // Only include patients with valid createdAt
          .map((p) => {
            try {
              const date = new Date(p.createdAt);
              if (isNaN(date.getTime())) return null;
              return {
                date: p.createdAt,
                count: 1,
              };
            } catch (e) {
              return null;
            }
          })
          .filter((item) => item !== null); // Remove null entries

        if (timeData.length > 0) {
          const grouped = groupByTimePeriod(timeData, input.groupBy);
          timeSeries = Object.values(grouped);
        }
      } catch (err) {
        logger.error('Error generating time series:', err);
        timeSeries = [];
      }
    }

    // Monthly patient registration (legacy field)
    let monthlyData = [];
    if (input.groupByField === 'month' || (!input.groupBy && input.groupByField)) {
      try {
        const monthData = patients
          .filter((p) => p.createdAt)
          .map((p) => {
            try {
              const date = new Date(p.createdAt);
              if (isNaN(date.getTime())) return null;
              return {
                date: p.createdAt,
                count: 1,
              };
            } catch (e) {
              return null;
            }
          })
          .filter((item) => item !== null);

        if (monthData.length > 0) {
          monthlyData = Object.values(groupByTimePeriod(monthData, input.groupByField || 'month'));
        }
      } catch (err) {
        logger.error('Error generating monthly data:', err);
        monthlyData = [];
      }
    }

    await AuditLogger.auditRead('report', 'patient', userId, tenantId);

    return {
      summary: {
        totalPatients: allPatients.length,
        newPatients: input.includeNewPatients && dateFilter ? patients.length : undefined,
      },
      breakdown: {
        gender: genderBreakdown,
        ageGroups,
        bloodGroups: bloodGroupBreakdown,
      },
      timeSeries: input.groupBy ? timeSeries : undefined, // For dashboard charts
      monthlyTrend: monthlyData.length > 0 ? monthlyData : undefined, // Legacy field
      period: {
        startDate: input.startDate,
        endDate: input.endDate,
      },
    };
  } catch (error) {
    logger.error('Error in getPatientReport:', {
      error: error.message,
      stack: error.stack,
      tenantId,
      userId,
      input,
    });
    // Return default structure on error
    return {
      summary: { totalPatients: 0 },
      breakdown: {
        gender: {},
        ageGroups: {
          '0-18': 0,
          '19-30': 0,
          '31-50': 0,
          '51-70': 0,
          '71+': 0,
        },
        bloodGroups: {},
      },
      timeSeries: input.groupBy ? [] : undefined,
      period: {
        startDate: input.startDate,
        endDate: input.endDate,
      },
    };
  }
}

/**
 * Appointment Analytics Report
 */
export async function getAppointmentReport(input, tenantId, userId) {
  await connectDB();

  const dateFilter = buildDateFilter(input.startDate, input.endDate);
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (dateFilter) {
    filter.appointmentDate = dateFilter;
  }

  if (input.doctorId) {
    filter.doctorId = input.doctorId;
  }

  if (input.patientId) {
    filter.patientId = input.patientId;
  }

  if (input.status) {
    filter.status = input.status;
  }

  if (input.type) {
    filter.type = input.type;
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'firstName lastName')
    .select('appointmentDate startTime endTime status type patientId doctorId')
    .lean();

  // Status breakdown
  const statusBreakdown = {};
  appointments.forEach((apt) => {
    const status = apt.status || 'unknown';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  });

  // Type breakdown
  const typeBreakdown = {};
  appointments.forEach((apt) => {
    const type = apt.type || 'unknown';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  // No-show rate
  const noShows = appointments.filter((apt) => apt.status === AppointmentStatus.NO_SHOW).length;
  const noShowRate = appointments.length > 0 ? (noShows / appointments.length) * 100 : 0;

  // Time series
  let timeSeries = [];
  if (input.groupBy) {
    try {
      const timeData = appointments
        .filter((apt) => apt.appointmentDate) // Only include appointments with valid dates
        .map((apt) => {
          try {
            // Try appointmentDate first, then startTime as fallback
            const dateValue = apt.appointmentDate || apt.startTime || apt.schedule?.date;
            if (!dateValue) return null;
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return null;
            return {
              date: dateValue,
              count: 1,
            };
          } catch (e) {
            return null;
          }
        })
        .filter((item) => item !== null); // Remove null entries

      if (timeData.length > 0) {
        timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
      }
    } catch (err) {
      logger.error('Error generating appointment time series:', err);
      timeSeries = [];
    }
  }

  await AuditLogger.auditRead('report', 'appointment', userId, tenantId);

  return {
    summary: {
      totalAppointments: appointments.length,
      completed: statusBreakdown[AppointmentStatus.COMPLETED] || 0,
      cancelled: statusBreakdown[AppointmentStatus.CANCELLED] || 0,
      noShows: input.includeNoShows ? noShows : undefined,
      noShowRate: input.includeNoShows ? Math.round(noShowRate * 100) / 100 : undefined,
    },
    breakdown: {
      statuses: statusBreakdown,
      types: typeBreakdown,
    },
    timeSeries: input.groupBy ? timeSeries : undefined,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

/**
 * Inventory Analytics Report
 */
export async function getInventoryReport(input, tenantId, userId) {
  await connectDB();

  const filter = withTenant(tenantId, {
    deletedAt: null,
    isActive: true,
  });

  if (input.itemType) {
    filter.type = input.itemType;
  }

  const items = await InventoryItem.find(filter).populate('primarySupplierId', 'name').lean();

  // Low stock items (available quantity at or below threshold)
  const lowStockItems = input.includeLowStock
    ? items.filter((item) => (item.availableQuantity ?? 0) <= (item.lowStockThreshold ?? 0))
    : [];

  // Expired items
  let expiredItems = [];
  if (input.includeExpired) {
    const now = new Date();
    items.forEach((item) => {
      item.batches?.forEach((batch) => {
        if (new Date(batch.expiryDate) < now && batch.quantity > 0) {
          expiredItems.push({
            itemId: item._id,
            itemName: item.name,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
          });
        }
      });
    });
  }

  // Type breakdown
  const typeBreakdown = {};
  items.forEach((item) => {
    const type = item.type || 'unknown';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  // Total inventory value
  const totalValue = items.reduce((sum, item) => {
    const cost = item.costPrice || 0;
    const quantity = item.totalQuantity || 0;
    return sum + cost * quantity;
  }, 0);

  // Inventory predictions (simple forecasting based on consumption)
  let predictions = [];
  if (input.includePredictions) {
    const dateFilter = buildDateFilter(input.startDate, input.endDate);
    const transactionFilter = withTenant(tenantId, {
      type: 'sale',
      deletedAt: null,
    });

    if (dateFilter) {
      transactionFilter.createdAt = dateFilter;
    }

    const transactions = await StockTransaction.find(transactionFilter).lean();

    // Calculate average consumption per item
    const consumptionByItem = {};
    transactions.forEach((txn) => {
      const itemId = txn.itemId?.toString() || 'unknown';
      consumptionByItem[itemId] = (consumptionByItem[itemId] || 0) + Math.abs(txn.quantity || 0);
    });

    // Predict reorder needs
    items.forEach((item) => {
      const itemId = item._id.toString();
      const avgConsumption = consumptionByItem[itemId] || 0;
      const daysInPeriod = dateFilter
        ? (new Date(dateFilter.$lte).getTime() - new Date(dateFilter.$gte).getTime()) /
          (1000 * 60 * 60 * 24)
        : 30;

      const dailyConsumption = avgConsumption / Math.max(daysInPeriod, 1);
      const daysUntilReorder =
        item.totalQuantity > 0 && dailyConsumption > 0
          ? Math.floor((item.totalQuantity - item.reorderPoint) / dailyConsumption)
          : 0;

      if (daysUntilReorder > 0 && daysUntilReorder <= 30) {
        predictions.push({
          itemId: item._id,
          itemName: item.name,
          currentStock: item.totalQuantity,
          reorderPoint: item.reorderPoint,
          predictedReorderDays: daysUntilReorder,
          dailyConsumption: Math.round(dailyConsumption * 100) / 100,
        });
      }
    });
  }

  await AuditLogger.auditRead('report', 'inventory', userId, tenantId);

  return {
    summary: {
      totalItems: items.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
    },
    breakdown: {
      types: typeBreakdown,
    },
    lowStockItems: input.includeLowStock
      ? lowStockItems.map((item) => ({
          id: item._id,
          name: item.name,
          currentStock: item.availableQuantity ?? item.totalQuantity,
          threshold: item.lowStockThreshold,
        }))
      : undefined,
    expiredItems: input.includeExpired ? expiredItems : undefined,
    predictions: input.includePredictions ? predictions : undefined,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(tenantId, userId) {
  try {
    await connectDB();

    // Validate tenantId
    if (!tenantId) {
      logger.warn('getDashboardStats called without tenantId');
      // Return default values if no tenantId
      return {
        todayAppointments: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        activePatients: 0,
        newPatientsThisMonth: 0,
        completedToday: 0,
        pendingInvoices: 0,
        appointmentsTrend: 0,
        revenueTrend: 0,
        patientsTrend: 0,
        newPatientsTrend: 0,
        completionTrend: 0,
        invoicesTrend: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    // Build filters once; run all independent queries in parallel (single round-trip)
    const todayFilter = withTenant(tenantId, {
      $or: [
        { startTime: { $gte: today, $lte: endOfToday } },
        { appointmentDate: { $gte: today, $lte: endOfToday } },
        { 'schedule.date': { $gte: today, $lte: endOfToday } },
      ],
      status: { $ne: AppointmentStatus.ARRIVED },
      deletedAt: null,
    });
    const yesterdayFilter = withTenant(tenantId, {
      $or: [
        { startTime: { $gte: yesterday, $lte: endOfYesterday } },
        { appointmentDate: { $gte: yesterday, $lte: endOfYesterday } },
        { 'schedule.date': { $gte: yesterday, $lte: endOfYesterday } },
      ],
      status: { $ne: AppointmentStatus.ARRIVED },
      deletedAt: null,
    });
    const completedTodayFilter = withTenant(tenantId, {
      $or: [
        { startTime: { $gte: today, $lte: endOfToday } },
        { appointmentDate: { $gte: today, $lte: endOfToday } },
        { 'schedule.date': { $gte: today, $lte: endOfToday } },
      ],
      status: AppointmentStatus.COMPLETED,
      deletedAt: null,
    });
    const completedYesterdayFilter = withTenant(tenantId, {
      $or: [
        { startTime: { $gte: yesterday, $lte: endOfYesterday } },
        { appointmentDate: { $gte: yesterday, $lte: endOfYesterday } },
        { 'schedule.date': { $gte: yesterday, $lte: endOfYesterday } },
      ],
      status: AppointmentStatus.COMPLETED,
      deletedAt: null,
    });

    const [
      todayAppointments,
      yesterdayAppointments,
      todayInvoicesRaw,
      yesterdayInvoicesRaw,
      monthInvoicesRaw,
      activePatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      completedToday,
      completedYesterday,
      pendingInvoices,
      pendingInvoicesYesterday,
    ] = await Promise.all([
      Appointment.countDocuments(todayFilter).catch((err) => {
        logger.error('Error counting today appointments:', err);
        return 0;
      }),
      Appointment.countDocuments(yesterdayFilter).catch((err) => {
        logger.error('Error counting yesterday appointments:', err);
        return 0;
      }),
      Invoice.find(
        withTenant(tenantId, {
          invoiceDate: { $gte: today, $lte: endOfToday },
          status: { $ne: InvoiceStatus.CANCELLED },
          deletedAt: null,
        })
      )
        .select('totalAmount')
        .lean()
        .catch((err) => {
          logger.error('Error fetching today invoices:', err);
          return [];
        }),
      Invoice.find(
        withTenant(tenantId, {
          invoiceDate: { $gte: yesterday, $lte: endOfYesterday },
          status: { $ne: InvoiceStatus.CANCELLED },
          deletedAt: null,
        })
      )
        .select('totalAmount')
        .lean()
        .catch((err) => {
          logger.error('Error fetching yesterday invoices:', err);
          return [];
        }),
      Invoice.find(
        withTenant(tenantId, {
          invoiceDate: { $gte: thisMonth },
          status: { $ne: InvoiceStatus.CANCELLED },
          deletedAt: null,
        })
      )
        .select('totalAmount')
        .lean()
        .catch((err) => {
          logger.error('Error fetching month invoices:', err);
          return [];
        }),
      Patient.countDocuments(withTenant(tenantId, { deletedAt: null })).catch((err) => {
        logger.error('Error counting active patients:', err);
        return 0;
      }),
      Patient.countDocuments(
        withTenant(tenantId, {
          createdAt: { $gte: thisMonth },
          deletedAt: null,
        })
      ).catch((err) => {
        logger.error('Error counting new patients this month:', err);
        return 0;
      }),
      Patient.countDocuments(
        withTenant(tenantId, {
          createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
          deletedAt: null,
        })
      ).catch((err) => {
        logger.error('Error counting new patients last month:', err);
        return 0;
      }),
      Appointment.countDocuments(completedTodayFilter).catch((err) => {
        logger.error('Error counting completed today:', err);
        return 0;
      }),
      Appointment.countDocuments(completedYesterdayFilter).catch((err) => {
        logger.error('Error counting completed yesterday:', err);
        return 0;
      }),
      Invoice.countDocuments(
        withTenant(tenantId, {
          status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
          deletedAt: null,
        })
      ).catch((err) => {
        logger.error('Error counting pending invoices:', err);
        return 0;
      }),
      Invoice.countDocuments(
        withTenant(tenantId, {
          status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
          deletedAt: null,
          invoiceDate: { $lte: endOfYesterday },
        })
      ).catch((err) => {
        logger.error('Error counting pending invoices yesterday:', err);
        return 0;
      }),
    ]);

    const todayRevenue = (Array.isArray(todayInvoicesRaw) ? todayInvoicesRaw : []).reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );
    const yesterdayRevenue = (
      Array.isArray(yesterdayInvoicesRaw) ? yesterdayInvoicesRaw : []
    ).reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const monthRevenue = (Array.isArray(monthInvoicesRaw) ? monthInvoicesRaw : []).reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    // Calculate trends
    const appointmentsTrend =
      yesterdayAppointments > 0
        ? (((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100).toFixed(1)
        : todayAppointments > 0
          ? '100'
          : '0';

    const revenueTrend =
      yesterdayRevenue > 0
        ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
        : todayRevenue > 0
          ? '100'
          : '0';

    const patientsTrend =
      newPatientsLastMonth > 0
        ? (((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100).toFixed(1)
        : newPatientsThisMonth > 0
          ? '100'
          : '0';

    const newPatientsTrend =
      newPatientsLastMonth > 0
        ? (((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100).toFixed(1)
        : newPatientsThisMonth > 0
          ? '100'
          : '0';

    const completionTrend =
      completedYesterday > 0
        ? (((completedToday - completedYesterday) / completedYesterday) * 100).toFixed(1)
        : completedToday > 0
          ? '100'
          : '0';

    const invoicesTrend =
      pendingInvoicesYesterday > 0
        ? (((pendingInvoices - pendingInvoicesYesterday) / pendingInvoicesYesterday) * 100).toFixed(
            1
          )
        : pendingInvoices > 0
          ? '100'
          : '0';

    await AuditLogger.auditRead('report', 'dashboard', userId, tenantId);

    return {
      todayAppointments,
      todayRevenue,
      monthRevenue,
      activePatients,
      newPatientsThisMonth,
      completedToday,
      pendingInvoices,
      appointmentsTrend: parseFloat(appointmentsTrend),
      revenueTrend: parseFloat(revenueTrend),
      patientsTrend: parseFloat(patientsTrend),
      newPatientsTrend: parseFloat(newPatientsTrend),
      completionTrend: parseFloat(completionTrend),
      invoicesTrend: parseFloat(invoicesTrend),
    };
  } catch (error) {
    logger.error('Error fetching dashboard stats:', {
      error: error.message,
      stack: error.stack,
      tenantId,
      userId,
    });
    // Return default values on error
    return {
      todayAppointments: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      activePatients: 0,
      newPatientsThisMonth: 0,
      completedToday: 0,
      pendingInvoices: 0,
      appointmentsTrend: 0,
      revenueTrend: 0,
      patientsTrend: 0,
      newPatientsTrend: 0,
      completionTrend: 0,
      invoicesTrend: 0,
    };
  }
}

/**
 * Doctor Performance Report
 */
export async function getDoctorPerformanceReport(input, tenantId, userId) {
  await connectDB();

  const dateFilter = buildDateFilter(input.startDate, input.endDate);

  // Get all doctors
  const doctors = await Doctor.find(
    withTenant(tenantId, {
      isActive: true,
    })
  )
    .populate('userId', 'firstName lastName')
    .lean();

  const doctorStats = [];

  for (const doctor of doctors) {
    // Filter appointments for this doctor
    const appointmentFilter = withTenant(tenantId, {
      doctorId: doctor._id,
      deletedAt: null,
    });

    if (dateFilter) {
      appointmentFilter.appointmentDate = dateFilter;
    }

    if (input.status) {
      appointmentFilter.status = input.status;
    }

    const appointments = await Appointment.find(appointmentFilter)
      .select('appointmentDate status')
      .lean();

    // Calculate statistics
    const totalAppointments = appointments.length;
    const completed = appointments.filter(
      (apt) => apt.status === AppointmentStatus.COMPLETED
    ).length;
    const cancelled = appointments.filter(
      (apt) => apt.status === AppointmentStatus.CANCELLED
    ).length;
    const noShows = appointments.filter((apt) => apt.status === AppointmentStatus.NO_SHOW).length;
    const completionRate = totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0;

    // Revenue from appointments - only fetch if we have appointments
    let invoices = [];
    if (appointments.length > 0) {
      const appointmentIds = appointments.map((apt) => apt._id);
      invoices = await Invoice.find(
        withTenant(tenantId, {
          appointmentId: { $in: appointmentIds },
          status: { $ne: InvoiceStatus.CANCELLED },
          deletedAt: null,
        })
      )
        .select('totalAmount')
        .lean();
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const averageRevenuePerAppointment = completed > 0 ? totalRevenue / completed : 0;

    // Clinical notes count
    const clinicalNotesFilter = withTenant(tenantId, {
      doctorId: doctor._id,
      deletedAt: null,
    });

    if (dateFilter) {
      clinicalNotesFilter.createdAt = dateFilter;
    }

    const clinicalNotesCount = await ClinicalNote.countDocuments(clinicalNotesFilter);

    // Time series data
    let timeSeries = [];
    if (input.groupBy) {
      const timeData = appointments.map((apt) => ({
        date: apt.appointmentDate,
        count: 1,
      }));
      timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
    }

    doctorStats.push({
      doctorId: doctor._id,
      doctorName: doctor.userId
        ? `${doctor.userId.firstName} ${doctor.userId.lastName}`
        : 'Unknown',
      departmentId: doctor.departmentId,
      specialization: doctor.specialization,
      totalAppointments,
      completed,
      cancelled,
      noShows,
      completionRate: Math.round(completionRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      totalRevenue,
      averageRevenuePerAppointment: Math.round(averageRevenuePerAppointment * 100) / 100,
      clinicalNotesCount,
      timeSeries: input.groupBy ? timeSeries : undefined,
    });
  }

  // Sort by total appointments (descending)
  doctorStats.sort((a, b) => b.totalAppointments - a.totalAppointments);

  await AuditLogger.auditRead('report', 'doctor_performance', userId, tenantId);

  return {
    summary: {
      totalDoctors: doctorStats.length,
      totalAppointments: doctorStats.reduce((sum, d) => sum + d.totalAppointments, 0),
      totalRevenue: doctorStats.reduce((sum, d) => sum + d.totalRevenue, 0),
      averageCompletionRate:
        doctorStats.length > 0
          ? doctorStats.reduce((sum, d) => sum + d.completionRate, 0) / doctorStats.length
          : 0,
    },
    doctors: doctorStats,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}

/**
 * Department-wise Analysis Report
 */
export async function getDepartmentReport(input, tenantId, userId) {
  await connectDB();

  const dateFilter = buildDateFilter(input.startDate, input.endDate);

  // Get all departments
  const departments = await Department.find(
    withTenant(tenantId, {
      isActive: true,
    })
  )
    .populate('headDoctorId', 'userId')
    .lean();

  const departmentStats = [];

  for (const dept of departments) {
    // Get doctors in this department
    const doctors = await Doctor.find(
      withTenant(tenantId, {
        departmentId: dept._id,
        isActive: true,
      })
    ).lean();

    const doctorIds = doctors.map((d) => d._id);

    // Filter appointments for this department
    const appointmentFilter = withTenant(tenantId, {
      doctorId: { $in: doctorIds },
      deletedAt: null,
    });

    if (dateFilter) {
      appointmentFilter.appointmentDate = dateFilter;
    }

    if (input.status) {
      appointmentFilter.status = input.status;
    }

    const appointments = await Appointment.find(appointmentFilter)
      .select('appointmentDate status')
      .lean();

    // Calculate statistics
    const totalAppointments = appointments.length;
    const completed = appointments.filter(
      (apt) => apt.status === AppointmentStatus.COMPLETED
    ).length;
    const cancelled = appointments.filter(
      (apt) => apt.status === AppointmentStatus.CANCELLED
    ).length;
    const noShows = appointments.filter((apt) => apt.status === AppointmentStatus.NO_SHOW).length;
    const completionRate = totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;

    // Revenue from appointments - only fetch if we have appointments
    let invoices = [];
    if (appointments.length > 0) {
      const appointmentIds = appointments.map((apt) => apt._id);
      invoices = await Invoice.find(
        withTenant(tenantId, {
          appointmentId: { $in: appointmentIds },
          status: { $ne: InvoiceStatus.CANCELLED },
          deletedAt: null,
        })
      )
        .select('totalAmount')
        .lean();
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const averageRevenuePerAppointment = completed > 0 ? totalRevenue / completed : 0;

    // Clinical notes count
    const clinicalNotesFilter = withTenant(tenantId, {
      doctorId: { $in: doctorIds },
      deletedAt: null,
    });

    if (dateFilter) {
      clinicalNotesFilter.createdAt = dateFilter;
    }

    const clinicalNotesCount = await ClinicalNote.countDocuments(clinicalNotesFilter);

    // Time series data
    let timeSeries = [];
    if (input.groupBy) {
      const timeData = appointments.map((apt) => ({
        date: apt.appointmentDate,
        count: 1,
      }));
      timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
    }

    departmentStats.push({
      departmentId: dept._id,
      departmentName: dept.name,
      departmentCode: dept.code,
      headDoctorId: dept.headDoctorId?._id,
      totalDoctors: doctors.length,
      totalAppointments,
      completed,
      cancelled,
      noShows,
      completionRate: Math.round(completionRate * 100) / 100,
      totalRevenue,
      averageRevenuePerAppointment: Math.round(averageRevenuePerAppointment * 100) / 100,
      clinicalNotesCount,
      timeSeries: input.groupBy ? timeSeries : undefined,
    });
  }

  // Sort by total appointments (descending)
  departmentStats.sort((a, b) => b.totalAppointments - a.totalAppointments);

  await AuditLogger.auditRead('report', 'department', userId, tenantId);

  return {
    summary: {
      totalDepartments: departmentStats.length,
      totalAppointments: departmentStats.reduce((sum, d) => sum + d.totalAppointments, 0),
      totalRevenue: departmentStats.reduce((sum, d) => sum + d.totalRevenue, 0),
      averageCompletionRate:
        departmentStats.length > 0
          ? departmentStats.reduce((sum, d) => sum + d.completionRate, 0) / departmentStats.length
          : 0,
    },
    departments: departmentStats,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
}
