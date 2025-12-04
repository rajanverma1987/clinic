/**
 * Billing service
 * Handles all billing-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import Invoice, { InvoiceStatus } from '@/models/Invoice.js';
import Payment, { PaymentStatus } from '@/models/Payment.js';
import Patient from '@/models/Patient.js';
import Tenant from '@/models/Tenant.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { calculateTax, parseAmount } from './tax-engine.service.js';
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination.js';

/**
 * Generate unique invoice number for a tenant
 */
async function generateInvoiceNumber(tenantId) {
  await connectDB();

  const lastInvoice = await Invoice.findOne(
    withTenant(tenantId, {}),
    { invoiceNumber: 1 }
  )
    .sort({ invoiceNumber: -1 })
    .lean();

  if (!lastInvoice) {
    return 'INV-0001';
  }

  const invoiceNumber = lastInvoice.invoiceNumber;
  if (!invoiceNumber) {
    return 'INV-0001';
  }

  const match = invoiceNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `INV-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'INV-0001';
}

/**
 * Generate unique payment number for a tenant
 */
async function generatePaymentNumber(tenantId) {
  await connectDB();

  const lastPayment = await Payment.findOne(
    withTenant(tenantId, {}),
    { paymentNumber: 1 }
  )
    .sort({ paymentNumber: -1 })
    .lean();

  if (!lastPayment) {
    return 'PAY-0001';
  }

  const paymentNumber = lastPayment.paymentNumber;
  if (!paymentNumber) {
    return 'PAY-0001';
  }

  const match = paymentNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PAY-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'PAY-0001';
}

/**
 * Calculate invoice totals
 */
async function calculateInvoiceTotals(
  items,
  discountType,
  discountValue,
  region = 'US',
  tenantId
) {
  // Calculate subtotal
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
  }

  // Apply item-level discounts
  let itemDiscounts = 0;
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      let itemTotal = item.unitPrice * item.quantity;
      let itemDiscount = 0;

      if (item.discount !== undefined) {
        // Percentage discount
        itemDiscount = Math.round((itemTotal * item.discount) / 100);
      } else if (item.discountAmount !== undefined) {
        // Fixed discount
        itemDiscount = item.discountAmount;
      }

      itemDiscounts += itemDiscount;
      itemTotal -= itemDiscount;

      // Calculate item tax
      const taxResult = await calculateTax({
        region,
        taxableAmount: itemTotal,
        items: [{ type: item.type, amount: itemTotal, taxRate: item.taxRate }],
      }, tenantId);

      return {
        ...item,
        total: itemTotal,
        discountAmount: itemDiscount,
        taxRate: item.taxRate,
        taxAmount: taxResult.totalTax,
        totalWithTax: itemTotal + taxResult.totalTax,
      };
    })
  );

  // Apply invoice-level discount
  let totalDiscount = itemDiscounts;
  let taxableAmount = subtotal - itemDiscounts;

  if (discountType && discountValue !== undefined) {
    if (discountType === 'percentage') {
      const invoiceDiscount = Math.round((taxableAmount * discountValue) / 100);
      totalDiscount += invoiceDiscount;
      taxableAmount -= invoiceDiscount;
    } else {
      // Fixed discount
      totalDiscount += discountValue;
      taxableAmount -= discountValue;
    }
  }

  // Calculate tax
  const taxResult = await calculateTax(
    {
      region,
      taxableAmount,
      items: enrichedItems.map((item) => ({
        type: item.type,
        amount: item.total,
        taxRate: item.taxRate,
      })),
    },
    tenantId
  );

  return {
    subtotal,
    totalDiscount,
    taxableAmount,
    totalTax: taxResult.totalTax,
    totalAmount: taxResult.finalAmount,
    taxBreakdown: taxResult.taxBreakdown,
  };
}

/**
 * Create a new invoice
 */
export async function createInvoice(input, tenantId, userId) {
  await connectDB();

  // Validate patient
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Get tenant
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Parse items (convert prices to minor units)
  const items = input.items.map((item) => ({
    ...item,
    unitPrice: parseAmount(item.unitPrice, tenant.settings.currency),
    discountAmount: item.discountAmount
      ? parseAmount(item.discountAmount, tenant.settings.currency)
      : undefined,
  }));

  // Calculate totals
  const totals = await calculateInvoiceTotals(
    items,
    input.discountType,
    input.discountValue ? parseAmount(input.discountValue, tenant.settings.currency) : undefined,
    tenant.region,
    tenantId
  );

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(tenantId);

  // Parse dates
  const dueDate = input.dueDate
    ? (input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate))
    : undefined;

  // Calculate patient payable
  const insuranceCoverage = input.insuranceCoverage
    ? parseAmount(input.insuranceCoverage, tenant.settings.currency)
    : 0;
  const patientPayable = totals.totalAmount - insuranceCoverage;

  // Create invoice
  const invoice = await Invoice.create({
    tenantId,
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    invoiceNumber,
    invoiceDate: new Date(),
    dueDate,
    status: InvoiceStatus.DRAFT,
    region: tenant.region,
    items,
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    taxableAmount: totals.taxableAmount,
    totalTax: totals.totalTax,
    totalAmount: totals.totalAmount,
    taxBreakdown: totals.taxBreakdown,
    discountType: input.discountType,
    discountValue: input.discountValue
      ? parseAmount(input.discountValue, tenant.settings.currency)
      : undefined,
    discountReason: input.discountReason,
    insuranceId: input.insuranceId,
    insuranceCoverage,
    patientPayable,
    paidAmount: 0,
    balanceAmount: patientPayable,
    currency: tenant.settings.currency,
    notes: input.notes,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'invoice',
    invoice._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return invoice;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId, tenantId, userId) {
  await connectDB();

  const invoice = await Invoice.findOne(
    withTenant(tenantId, {
      _id: invoiceId,
      deletedAt: null,
    })
  )
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('appointmentId', 'appointmentDate startTime')
    .lean();

  if (invoice) {
    await AuditLogger.auditRead('invoice', invoiceId, userId, tenantId);
  }

  return invoice;
}

/**
 * List invoices with pagination and filters
 */
export async function listInvoices(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filters
  if (query.startDate || query.endDate) {
    filter.invoiceDate = {};
    if (query.startDate) {
      filter.invoiceDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.invoiceDate.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await Invoice.countDocuments(filter);

  // Get paginated results
  const invoices = await Invoice.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .sort({ invoiceDate: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'invoice',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: invoices.length, filters: query }
  );

  return createPaginationResult(invoices, total, page || 1, limit || 10);
}

/**
 * Update invoice
 */
export async function updateInvoice(invoiceId, input, tenantId, userId) {
  await connectDB();

  const existing = await Invoice.findOne(
    withTenant(tenantId, {
      _id: invoiceId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to paid or cancelled invoices
  if (
    existing.status === InvoiceStatus.PAID ||
    existing.status === InvoiceStatus.CANCELLED
  ) {
    throw new Error('Cannot update paid or cancelled invoice');
  }

  const before = existing.toObject();
  const tenant = await Tenant.findById(tenantId);

  // Recalculate if items changed
  if (input.items) {
    const items = input.items.map((item) => ({
      ...item,
      unitPrice: parseAmount(item.unitPrice, existing.currency),
      discountAmount: item.discountAmount
        ? parseAmount(item.discountAmount, existing.currency)
        : undefined,
    }));

    const totals = await calculateInvoiceTotals(
      items,
      input.discountType || existing.discountType,
      input.discountValue
        ? parseAmount(input.discountValue, existing.currency)
        : existing.discountValue,
      existing.region,
      tenantId
    );

    input.items = items;
    input.subtotal = totals.subtotal;
    input.totalDiscount = totals.totalDiscount;
    input.taxableAmount = totals.taxableAmount;
    input.totalTax = totals.totalTax;
    input.totalAmount = totals.totalAmount;
    input.taxBreakdown = totals.taxBreakdown;
  }

  // Remove patientId from update
  delete input.patientId;

  const invoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    { $set: input },
    { new: true, runValidators: true }
  );

  if (invoice) {
    await AuditLogger.auditWrite(
      'invoice',
      invoice._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: invoice.toObject() }
    );
  }

  return invoice;
}

/**
 * Create a payment
 */
export async function createPayment(input, tenantId, userId) {
  await connectDB();

  // Validate invoice
  const invoice = await Invoice.findOne(
    withTenant(tenantId, {
      _id: input.invoiceId,
      deletedAt: null,
    })
  );

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Validate payment amount
  const paymentAmount = parseAmount(input.amount, invoice.currency);
  const remainingBalance = invoice.balanceAmount;

  if (paymentAmount > remainingBalance) {
    throw new Error('Payment amount exceeds remaining balance');
  }

  // Generate payment number
  const paymentNumber = await generatePaymentNumber(tenantId);

  // Create payment
  const payment = await Payment.create({
    tenantId,
    invoiceId: input.invoiceId,
    patientId: invoice.patientId,
    paymentNumber,
    amount: paymentAmount,
    currency: invoice.currency,
    paymentMethod: input.paymentMethod,
    status: PaymentStatus.COMPLETED,
    transactionId: input.transactionId,
    receiptNumber: input.receiptNumber,
    gateway: input.gateway,
    paymentDate: new Date(),
    createdBy: userId,
    notes: input.notes,
  });

  // Update invoice payment status
  const newPaidAmount = invoice.paidAmount + paymentAmount;
  const newBalanceAmount = invoice.balanceAmount - paymentAmount;

  let newStatus = invoice.status;
  if (newBalanceAmount <= 0) {
    newStatus = InvoiceStatus.PAID;
  } else if (newPaidAmount > 0) {
    newStatus = InvoiceStatus.PARTIAL;
  }

  await Invoice.findByIdAndUpdate(invoice._id, {
    paidAmount: newPaidAmount,
    balanceAmount: newBalanceAmount,
    status: newStatus,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'payment',
    payment._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return payment;
}

/**
 * List payments
 */
export async function listPayments(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.invoiceId) {
    filter.invoiceId = query.invoiceId;
  }

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  // Date filters
  if (query.startDate || query.endDate) {
    filter.paymentDate = {};
    if (query.startDate) {
      filter.paymentDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.paymentDate.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await Payment.countDocuments(filter);

  // Get paginated results
  const payments = await Payment.find(filter)
    .populate('invoiceId', 'invoiceNumber invoiceDate')
    .populate('patientId', 'firstName lastName patientId')
    .populate('createdBy', 'firstName lastName')
    .sort({ paymentDate: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  return createPaginationResult(payments, total, page || 1, limit || 10);
}

/**
 * Soft delete invoice
 */
export async function deleteInvoice(invoiceId, tenantId, userId) {
  await connectDB();

  const invoice = await Invoice.findOne(
    withTenant(tenantId, {
      _id: invoiceId,
      deletedAt: null,
    })
  );

  if (!invoice) {
    return false;
  }

  invoice.deletedAt = new Date();
  invoice.isActive = false;
  await invoice.save();

  await AuditLogger.auditWrite(
    'invoice',
    invoice._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}

