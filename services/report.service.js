/**
 * Reporting service
 * Handles all reporting and analytics business logic
 */

import connectDB from '@/lib/db/connection.js';
import Invoice, { InvoiceStatus } from '@/models/Invoice.js';
import Payment, { PaymentStatus } from '@/models/Payment.js';
import Patient from '@/models/Patient.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import InventoryItem from '@/models/InventoryItem.js';
import StockTransaction from '@/models/StockTransaction.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

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

  data.forEach((item) => {
    const date = new Date(item.date);
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

  // Get invoices
  const invoices = await Invoice.find(filter)
    .populate('patientId', 'firstName lastName')
    .populate('appointmentId', 'doctorId startTime')
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
    const timeData = filteredInvoices.map((inv) => ({
      date: inv.invoiceDate,
      amount: inv.totalAmount || 0,
      count: 1,
    }));
    timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
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
  await connectDB();

  const dateFilter = buildDateFilter(input.startDate, input.endDate);
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  // Get all patients
  const allPatients = await Patient.find(filter).lean();

  // Filter by date if provided (for new patients)
  let patients = allPatients;
  if (input.includeNewPatients && dateFilter) {
    patients = allPatients.filter((p) => {
      const created = new Date(p.createdAt);
      return created >= new Date(dateFilter.$gte) && created <= new Date(dateFilter.$lte);
    });
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
    const dob = new Date(p.dateOfBirth);
    const age = now.getFullYear() - dob.getFullYear();
    if (age <= 18) ageGroups['0-18']++;
    else if (age <= 30) ageGroups['19-30']++;
    else if (age <= 50) ageGroups['31-50']++;
    else if (age <= 70) ageGroups['51-70']++;
    else ageGroups['71+']++;
  });

  // Blood group breakdown
  const bloodGroupBreakdown = {};
  patients.forEach((p) => {
    if (p.bloodGroup) {
      bloodGroupBreakdown[p.bloodGroup] = (bloodGroupBreakdown[p.bloodGroup] || 0) + 1;
    }
  });

  // Monthly patient registration
  let monthlyData = [];
  if (input.groupByField === 'month' || input.groupBy) {
    const monthData = patients.map((p) => ({
      date: p.createdAt,
      count: 1,
    }));
    monthlyData = Object.values(groupByTimePeriod(monthData, input.groupBy || 'month'));
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
    monthlyTrend: monthlyData.length > 0 ? monthlyData : undefined,
    period: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  };
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
    const timeData = appointments.map((apt) => ({
      date: apt.appointmentDate,
      count: 1,
    }));
    timeSeries = Object.values(groupByTimePeriod(timeData, input.groupBy));
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

  const items = await InventoryItem.find(filter)
    .populate('primarySupplierId', 'name')
    .lean();

  // Low stock items
  const lowStockItems = input.includeLowStock
    ? items.filter((item) => item.totalQuantity <= item.lowStockThreshold)
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
    lowStockItems: input.includeLowStock ? lowStockItems.map((item) => ({
      id: item._id,
      name: item.name,
      currentStock: item.totalQuantity,
      threshold: item.lowStockThreshold,
    })) : undefined,
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
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisYear = new Date(today.getFullYear(), 0, 1);

  // Today's appointments (exclude "arrived" status - they should only appear in queue)
  // Match the appointments page logic: filter by date and exclude "arrived" status
  const todayAppointments = await Appointment.countDocuments(
    withTenant(tenantId, {
      appointmentDate: { $gte: today, $lte: endOfToday },
      status: { $ne: AppointmentStatus.ARRIVED },
      deletedAt: null,
    })
  );

  // This month's revenue
  const monthInvoices = await Invoice.find(
    withTenant(tenantId, {
      invoiceDate: { $gte: thisMonth },
      status: { $ne: InvoiceStatus.CANCELLED },
      deletedAt: null,
    })
  ).lean();

  const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // Total patients
  const totalPatients = await Patient.countDocuments(
    withTenant(tenantId, {
      deletedAt: null,
    })
  );

  // Pending invoices
  const pendingInvoices = await Invoice.countDocuments(
    withTenant(tenantId, {
      status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
      deletedAt: null,
    })
  );

  // Low stock items
  const lowStockItems = await InventoryItem.countDocuments(
    withTenant(tenantId, {
      $expr: { $lte: ['$totalQuantity', '$lowStockThreshold'] },
      deletedAt: null,
      isActive: true,
    })
  );

  await AuditLogger.auditRead('report', 'dashboard', userId, tenantId);

  return {
    todayAppointments,
    monthRevenue,
    totalPatients,
    pendingInvoices,
    lowStockItems,
  };
}

