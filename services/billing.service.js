/**
 * Billing service
 * Handles all billing-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import Invoice, { InvoiceStatus } from '@/models/Invoice.js';
import Payment, { PaymentStatus } from '@/models/Payment.js';
import Patient from '@/models/Patient.js';
import Appointment from '@/models/Appointment.js';
import Tenant from '@/models/Tenant.js';
import InventoryItem from '@/models/InventoryItem.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { calculateTax, parseAmount } from './tax-engine.service.js';
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination.js';
import { createStockTransaction } from './inventory.service.js';
import { TransactionType } from '@/models/StockTransaction.js';

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
    items: enrichedItems, // Return enriched items with total and totalWithTax
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

  // Calculate totals (this also enriches items with total and totalWithTax)
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

  // Create invoice using enriched items (with total and totalWithTax)
  const invoice = await Invoice.create({
    tenantId,
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    invoiceNumber,
    invoiceDate: new Date(),
    dueDate,
    status: InvoiceStatus.DRAFT,
    region: tenant.region,
    items: totals.items, // Use enriched items from calculateInvoiceTotals
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

  // Reduce inventory for medication items if invoice is not draft
  if (input.status && input.status !== InvoiceStatus.DRAFT) {
    await reduceInventoryForInvoice(invoice, tenantId, userId);
  }

  return invoice;
}

/**
 * Reduce inventory for medication items in an invoice
 */
async function reduceInventoryForInvoice(invoice, tenantId, userId) {
  try {
    // Check if inventory was already reduced for this invoice
    const StockTransaction = (await import('@/models/StockTransaction.js')).default;
    const existingTransactions = await StockTransaction.find(
      withTenant(tenantId, {
        invoiceId: invoice._id,
        type: TransactionType.SALE,
        deletedAt: null,
      })
    ).lean();

    if (existingTransactions.length > 0) {
      console.log(`Inventory already reduced for invoice ${invoice.invoiceNumber}`);
      return; // Inventory already reduced
    }

    // Process each invoice item
    for (const item of invoice.items || []) {
      // Only process medication items
      if (item.type !== 'medication') {
        continue;
      }

      // Find inventory item by prescription or drugId
      let inventoryItem = null;
      
      if (item.prescriptionId) {
        // If we have prescriptionId, find the prescription and get drugId
        const Prescription = (await import('@/models/Prescription.js')).default;
        const prescription = await Prescription.findOne(
          withTenant(tenantId, {
            _id: item.prescriptionId,
            deletedAt: null,
          })
        ).lean();

        if (prescription && prescription.items) {
          // Find the matching drug item in prescription
          const prescriptionItem = prescription.items.find(
            pi => pi.itemType === 'drug' && pi.drugId
          );
          
          if (prescriptionItem && prescriptionItem.drugId) {
            // Find inventory item by drugId
            inventoryItem = await InventoryItem.findOne(
              withTenant(tenantId, {
                drugId: prescriptionItem.drugId,
                deletedAt: null,
              })
            );
          }
        }
      }

      // If we still don't have inventory item, try to find by description or name
      if (!inventoryItem && item.description) {
        // Try to extract drug name from description
        const descriptionMatch = item.description.match(/^([^(]+)/);
        if (descriptionMatch) {
          const drugName = descriptionMatch[1].trim();
          inventoryItem = await InventoryItem.findOne(
            withTenant(tenantId, {
              $or: [
                { name: { $regex: new RegExp(drugName, 'i') } },
                { brandName: { $regex: new RegExp(drugName, 'i') } },
                { genericName: { $regex: new RegExp(drugName, 'i') } },
              ],
              deletedAt: null,
            })
          );
        }
      }

      if (!inventoryItem) {
        console.warn(`Inventory item not found for invoice item: ${item.description}`);
        continue;
      }

      // Check if stock is available
      if (inventoryItem.availableQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.availableQuantity}, Required: ${item.quantity}`
        );
      }

      // Create stock transaction (negative quantity for sale)
      await createStockTransaction(
        {
          inventoryItemId: inventoryItem._id,
          type: TransactionType.SALE,
          quantity: -item.quantity, // Negative for sale
          unitPrice: item.unitPrice,
          invoiceId: invoice._id,
          prescriptionId: item.prescriptionId,
          referenceNumber: invoice.invoiceNumber,
          notes: `Sold via invoice ${invoice.invoiceNumber}`,
        },
        tenantId,
        userId
      );
    }
  } catch (error) {
    console.error('Error reducing inventory for invoice:', error);
    throw error;
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId, tenantId, userId) {
  await connectDB();

  try {
    const invoice = await Invoice.findOne(
      withTenant(tenantId, {
        _id: invoiceId,
        deletedAt: null,
      })
    )
      .populate({
        path: 'patientId',
        select: 'firstName lastName patientId phone',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate startTime',
        options: { strictPopulate: false }
      })
      .lean();

    if (invoice) {
      await AuditLogger.auditRead('invoice', invoiceId, userId, tenantId);
    }

    return invoice;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    console.error('Invoice ID:', invoiceId, 'Tenant ID:', tenantId);
    throw error;
  }
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

    // Use enriched items from calculateInvoiceTotals (with total and totalWithTax)
    input.items = totals.items || items;
    input.subtotal = totals.subtotal;
    input.totalDiscount = totals.totalDiscount;
    input.taxableAmount = totals.taxableAmount;
    input.totalTax = totals.totalTax;
    input.totalAmount = totals.totalAmount;
    input.taxBreakdown = totals.taxBreakdown;
  }

  // Remove patientId from update
  delete input.patientId;

  // If status is being changed to 'paid', automatically set paidAmount and balanceAmount
  if (input.status === InvoiceStatus.PAID && existing.status !== InvoiceStatus.PAID) {
    input.paidAmount = existing.totalAmount;
    input.balanceAmount = 0;
  }

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

    // Reduce inventory if status changed from DRAFT to finalized status
    if (
      existing.status === InvoiceStatus.DRAFT &&
      input.status &&
      input.status !== InvoiceStatus.DRAFT &&
      input.status !== InvoiceStatus.CANCELLED
    ) {
      await reduceInventoryForInvoice(invoice, tenantId, userId);
    }
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

