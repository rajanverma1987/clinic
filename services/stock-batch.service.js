/**
 * Stock Batch service
 * Handles all stock batch-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import StockBatch from '@/models/StockBatch.js';
import Drug from '@/models/Drug.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new stock batch
 */
export async function createStockBatch(input, tenantId, userId) {
  await connectDB();

  // Validate medicine exists and belongs to tenant
  const medicine = await Drug.findOne(
    withTenant(tenantId, {
      _id: input.medicineId,
      isActive: true,
    })
  );

  if (!medicine) {
    throw new Error('Medicine not found or inactive');
  }

  // Check if batch number already exists for this tenant
  const existing = await StockBatch.findOne(
    withTenant(tenantId, {
      batchNumber: input.batchNumber.toUpperCase(),
    })
  );

  if (existing) {
    throw new Error('Batch number already exists');
  }

  // Parse dates
  const manufacturedDate = input.manufacturedDate
    ? (input.manufacturedDate instanceof Date ? input.manufacturedDate : new Date(input.manufacturedDate))
    : undefined;
  const expiryDate = input.expiryDate instanceof Date ? input.expiryDate : new Date(input.expiryDate);
  const receivedDate = input.receivedDate
    ? (input.receivedDate instanceof Date ? input.receivedDate : new Date(input.receivedDate))
    : new Date();

  // Create stock batch
  const batch = await StockBatch.create({
    tenantId,
    medicineId: input.medicineId,
    batchNumber: input.batchNumber.toUpperCase(),
    quantity: {
      received: input.quantity || 0,
      current: input.quantity || 0,
      sold: 0,
      returned: 0,
    },
    pricing: {
      purchasePrice: input.purchasePrice || 0,
      sellingPrice: input.sellingPrice || 0,
    },
    dates: {
      manufactured: manufacturedDate,
      expiry: expiryDate,
      received: receivedDate,
    },
    supplier: {
      name: input.supplierName || '',
      invoiceNumber: input.supplierInvoiceNumber || '',
    },
    location: input.location || '',
    status: 'active',
  });

  // Audit log
  await AuditLogger.auditWrite(
    'stock_batch',
    batch._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return batch;
}

/**
 * Get stock batch by ID
 */
export async function getStockBatchById(batchId, tenantId, userId) {
  await connectDB();

  const batch = await StockBatch.findOne(
    withTenant(tenantId, {
      _id: batchId,
    })
  )
    .populate('medicineId', 'name code genericName')
    .lean();

  if (batch) {
    await AuditLogger.auditRead('stock_batch', batchId, userId, tenantId);
  }

  return batch;
}

/**
 * List stock batches with pagination and filters
 */
export async function listStockBatches(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {});

  if (query.medicineId) {
    filter.medicineId = query.medicineId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.expiringSoon) {
    const days = parseInt(query.expiringSoon, 10) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    filter['dates.expiry'] = {
      $gte: new Date(),
      $lte: futureDate,
    };
  }

  if (query.expired) {
    filter['dates.expiry'] = { $lt: new Date() };
    filter.status = { $ne: 'depleted' };
  }

  if (query.batchNumber) {
    filter.batchNumber = { $regex: query.batchNumber, $options: 'i' };
  }

  // Get total count
  const total = await StockBatch.countDocuments(filter);

  // Get paginated results
  const batches = await StockBatch.find(filter)
    .populate('medicineId', 'name code genericName')
    .sort({ 'dates.expiry': 1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'stock_batch',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: batches.length, filters: query }
  );

  return createPaginationResult(batches, total, page || 1, limit || 10);
}

/**
 * Update stock batch
 */
export async function updateStockBatch(batchId, input, tenantId, userId) {
  await connectDB();

  const existing = await StockBatch.findOne(
    withTenant(tenantId, {
      _id: batchId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Parse dates if provided
  if (input.expiryDate) {
    if (!updateData.dates) updateData.dates = {};
    updateData.dates.expiry = input.expiryDate instanceof Date ? input.expiryDate : new Date(input.expiryDate);
  }

  if (input.manufacturedDate) {
    if (!updateData.dates) updateData.dates = {};
    updateData.dates.manufactured = input.manufacturedDate instanceof Date
      ? input.manufacturedDate
      : new Date(input.manufacturedDate);
  }

  // Update batch number if changed
  if (input.batchNumber && input.batchNumber.toUpperCase() !== existing.batchNumber) {
    const codeExists = await StockBatch.findOne(
      withTenant(tenantId, {
        batchNumber: input.batchNumber.toUpperCase(),
        _id: { $ne: batchId },
      })
    );

    if (codeExists) {
      throw new Error('Batch number already exists');
    }

    updateData.batchNumber = input.batchNumber.toUpperCase();
  }

  // Update status if expired
  if (updateData.dates?.expiry && new Date(updateData.dates.expiry) < new Date()) {
    if (existing.quantity.current > 0) {
      updateData.status = 'expired';
    } else {
      updateData.status = 'depleted';
    }
  }

  const batch = await StockBatch.findByIdAndUpdate(
    batchId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('medicineId', 'name code genericName');

  if (batch) {
    await AuditLogger.auditWrite(
      'stock_batch',
      batch._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: batch.toObject() }
    );
  }

  return batch;
}

/**
 * Update batch quantity (for sales, returns, adjustments)
 */
export async function updateBatchQuantity(batchId, quantityChange, transactionType, tenantId, userId) {
  await connectDB();

  const batch = await StockBatch.findOne(
    withTenant(tenantId, {
      _id: batchId,
    })
  );

  if (!batch) {
    return null;
  }

  const before = batch.toObject();

  // Update quantities based on transaction type
  if (transactionType === 'sale') {
    if (batch.quantity.current < quantityChange) {
      throw new Error('Insufficient stock in batch');
    }
    batch.quantity.current -= quantityChange;
    batch.quantity.sold += quantityChange;
  } else if (transactionType === 'return') {
    batch.quantity.current += quantityChange;
    batch.quantity.returned += quantityChange;
  } else if (transactionType === 'adjustment') {
    batch.quantity.current += quantityChange;
    if (quantityChange < 0) {
      batch.quantity.current = Math.max(0, batch.quantity.current);
    }
  }

  // Update status if depleted
  if (batch.quantity.current <= 0) {
    batch.status = 'depleted';
  } else if (batch.dates.expiry < new Date()) {
    batch.status = 'expired';
  } else {
    batch.status = 'active';
  }

  await batch.save();

  // Audit log
  await AuditLogger.auditWrite(
    'stock_batch',
    batch._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: batch.toObject() },
    { action: 'update_quantity', transactionType, quantityChange }
  );

  return batch;
}

/**
 * Get expiring batches (within specified days)
 */
export async function getExpiringBatches(days, tenantId, userId) {
  await connectDB();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + (days || 30));

  const batches = await StockBatch.find(
    withTenant(tenantId, {
      'dates.expiry': {
        $gte: new Date(),
        $lte: futureDate,
      },
      status: { $ne: 'depleted' },
      'quantity.current': { $gt: 0 },
    })
  )
    .populate('medicineId', 'name code genericName')
    .sort({ 'dates.expiry': 1 })
    .lean();

  // Audit access
  await AuditLogger.auditRead('stock_batch', `expiring_${days}days`, userId, tenantId);

  return batches;
}

/**
 * Get expired batches
 */
export async function getExpiredBatches(tenantId, userId) {
  await connectDB();

  const batches = await StockBatch.find(
    withTenant(tenantId, {
      'dates.expiry': { $lt: new Date() },
      status: { $ne: 'depleted' },
      'quantity.current': { $gt: 0 },
    })
  )
    .populate('medicineId', 'name code genericName')
    .sort({ 'dates.expiry': 1 })
    .lean();

  // Audit access
  await AuditLogger.auditRead('stock_batch', 'expired', userId, tenantId);

  return batches;
}

/**
 * Delete stock batch (soft delete by setting status)
 */
export async function deleteStockBatch(batchId, tenantId, userId) {
  await connectDB();

  const batch = await StockBatch.findOne(
    withTenant(tenantId, {
      _id: batchId,
    })
  );

  if (!batch) {
    return false;
  }

  // Only allow deletion if batch is depleted
  if (batch.quantity.current > 0) {
    throw new Error('Cannot delete batch with remaining stock');
  }

  batch.status = 'depleted';
  await batch.save();

  await AuditLogger.auditWrite(
    'stock_batch',
    batch._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
