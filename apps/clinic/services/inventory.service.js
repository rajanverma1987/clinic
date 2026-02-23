/**
 * Inventory Service
 *
 * Enterprise-grade service for inventory management with comprehensive
 * stock tracking, batch management, and transaction logging.
 *
 * Features:
 * - Inventory item management (medicines, supplies, equipment)
 * - Stock level tracking with low stock alerts
 * - Batch management with expiry tracking
 * - Stock transactions (purchase, sale, adjustment, transfer)
 * - Supplier integration
 * - Multi-tenant isolation
 * - Audit logging
 * - Real-time stock updates
 *
 * @module services/inventory.service
 * @since 1.0.0
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import {
  notifyMedicineExpired,
  notifyStockLow,
  notifyStockUpdated,
} from '@/lib/realtime/integration-helpers.js';
import { measureTime } from '@/lib/utils/enterprise-helpers.js';
import { logger } from '@/lib/utils/logger.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import InventoryItem from '@/models/InventoryItem.js';
import StockTransaction, { TransactionStatus } from '@/models/StockTransaction.js';
import Supplier from '@/models/Supplier.js';
import mongoose from 'mongoose';
import { parseAmount } from './tax-engine.service.js';

/**
 * Generate unique transaction number for a tenant
 */
async function generateTransactionNumber(tenantId) {
  await connectDB();

  const lastTransaction = await StockTransaction.findOne(withTenant(tenantId, {}), {
    transactionNumber: 1,
  })
    .sort({ transactionNumber: -1 })
    .lean();

  if (!lastTransaction) {
    return 'STX-0001';
  }

  const transactionNumber = lastTransaction.transactionNumber;
  if (!transactionNumber) {
    return 'STX-0001';
  }

  const match = transactionNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `STX-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'STX-0001';
}

/**
 * Update inventory item stock
 */
async function updateItemStock(item, quantity, batchNumber, expiryDate) {
  item.totalQuantity += quantity;
  item.availableQuantity += quantity;

  // Update or add batch
  if (batchNumber && expiryDate) {
    const existingBatch = item.batches.find((b) => b.batchNumber === batchNumber);
    if (existingBatch) {
      existingBatch.quantity += quantity;
    } else {
      item.batches.push({
        batchNumber,
        expiryDate,
        quantity,
      });
    }
  }

  await item.save();
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(input, tenantId, userId) {
  await connectDB();

  // Parse batches if provided
  const batches = [];
  let totalQuantity = 0;

  if (input.batches) {
    for (const batch of input.batches) {
      const expiryDate =
        batch.expiryDate instanceof Date ? batch.expiryDate : new Date(batch.expiryDate);

      batches.push({
        batchNumber: batch.batchNumber,
        expiryDate,
        quantity: batch.quantity,
        purchasePrice: batch.purchasePrice
          ? parseAmount(batch.purchasePrice, input.currency || 'USD')
          : undefined,
        purchaseDate: batch.purchaseDate
          ? batch.purchaseDate instanceof Date
            ? batch.purchaseDate
            : new Date(batch.purchaseDate)
          : undefined,
        supplierId: batch.supplierId,
      });

      totalQuantity += batch.quantity;
    }
  } else if (input.currentStock !== undefined && input.currentStock > 0) {
    // If currentStock is provided without batches, create a default batch
    const defaultBatchNumber = input.batchNumber || `BATCH-${Date.now()}`;
    const defaultExpiryDate = input.expiryDate
      ? new Date(input.expiryDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    batches.push({
      batchNumber: defaultBatchNumber,
      expiryDate: defaultExpiryDate,
      quantity: input.currentStock,
      purchasePrice: input.costPrice
        ? parseAmount(input.costPrice, input.currency || 'USD')
        : undefined,
      purchaseDate: new Date(),
      supplierId: undefined,
    });

    totalQuantity = input.currentStock;
  }

  // Create inventory item
  const item = await InventoryItem.create({
    tenantId,
    name: input.name,
    code: input.code,
    type: input.type,
    description: input.description,
    drugId: input.drugId,
    genericName: input.genericName,
    brandName: input.brandName,
    form: input.form,
    strength: input.strength,
    unit: input.unit,
    totalQuantity,
    availableQuantity: totalQuantity,
    reservedQuantity: 0,
    costPrice: input.costPrice ? parseAmount(input.costPrice, input.currency || 'USD') : undefined,
    sellingPrice: input.sellingPrice
      ? parseAmount(input.sellingPrice, input.currency || 'USD')
      : undefined,
    currency: input.currency || 'USD',
    lowStockThreshold: input.lowStockThreshold,
    reorderPoint: input.reorderPoint,
    reorderQuantity: input.reorderQuantity,
    primarySupplierId: input.primarySupplierId,
    location: input.location,
    batches,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'inventory_item',
    item._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  return item;
}

/**
 * Get inventory item by ID
 */
export async function getInventoryItemById(itemId, tenantId, userId) {
  await connectDB();

  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: itemId,
      deletedAt: null,
    }),
  )
    .populate('drugId', 'name genericName')
    .populate('primarySupplierId', 'name code')
    .lean();

  if (item) {
    await AuditLogger.auditRead('inventory_item', itemId, userId, tenantId);
  }

  return item;
}

/**
 * List inventory items with pagination and filters
 */
export async function listInventoryItems(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Low stock: available (usable) quantity at or below threshold
  if (query.lowStock) {
    filter.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
  }

  // Expired batches filter (items with expired batches)
  if (query.expired) {
    filter['batches.expiryDate'] = { $lt: new Date() };
  }

  // Text search
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { code: { $regex: query.search, $options: 'i' } },
      { genericName: { $regex: query.search, $options: 'i' } },
      { brandName: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Lightweight list: no $lookup, minimal fields, cap 500 — for dropdowns (e.g. prescription medicines)
  if (query.lightweight) {
    const cap = Math.min(500, parseInt(query.limit, 10) || 500);
    const items = await InventoryItem.find(filter)
      .select('_id name brandName genericName form strength type')
      .sort({ name: 1 })
      .limit(cap)
      .lean();
    return createPaginationResult(items, items.length, 1, items.length);
  }

  // Early return optimization: Quick check if any items exist
  const hasItems = await InventoryItem.countDocuments(filter);
  if (hasItems === 0) {
    // No items exist - return empty result immediately
    await AuditLogger.auditWrite(
      'inventory_item',
      'list',
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      { count: 0, filters: query, emptyCollection: true },
    );
    return createPaginationResult([], 0, page || 1, limit || 10);
  }

  // Get total count
  const total = await InventoryItem.countDocuments(filter);

  // Get paginated results - use aggregation with $lookup instead of populate for better performance
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'primarySupplierId',
        foreignField: '_id',
        as: 'supplier',
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    {
      $addFields: {
        primarySupplierId: { $arrayElemAt: ['$supplier', 0] },
      },
    },
    { $sort: { name: 1 } },
    { $skip: ((page || 1) - 1) * (limit || 10) },
    { $limit: limit || 10 },
  ];

  const items = await InventoryItem.aggregate(pipeline);

  // Audit list access
  await AuditLogger.auditWrite(
    'inventory_item',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: items.length, filters: query },
  );

  return createPaginationResult(items, total, page || 1, limit || 10);
}

/**
 * Get low stock items
 * Optimized: Uses aggregation instead of populate for better performance
 */
export async function getLowStockItems(tenantId, userId) {
  await connectDB();

  const filter = withTenant(tenantId, {
    deletedAt: null,
    isActive: true,
    $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
  });

  // Early return optimization: Quick check if any low stock items exist
  const hasLowStock = await InventoryItem.countDocuments(filter);
  if (hasLowStock === 0) {
    return [];
  }

  // Use aggregation with $lookup instead of populate for better performance
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'primarySupplierId',
        foreignField: '_id',
        as: 'supplier',
        pipeline: [{ $project: { name: 1, code: 1, phone: 1 } }],
      },
    },
    {
      $addFields: {
        primarySupplierId: { $arrayElemAt: ['$supplier', 0] },
      },
    },
    { $sort: { availableQuantity: 1 } },
  ];

  const items = await InventoryItem.aggregate(pipeline);
  return items;
}

/**
 * Get expired items
 */
export async function getExpiredItems(tenantId, userId) {
  await connectDB();

  const items = await InventoryItem.find(
    withTenant(tenantId, {
      deletedAt: null,
      isActive: true,
      'batches.expiryDate': { $lt: new Date() },
    }),
  ).lean();

  const expiredBatches = [];

  for (const item of items) {
    const expired = item.batches.filter((batch) => new Date(batch.expiryDate) < new Date());

    for (const batch of expired) {
      expiredBatches.push({ item, batch });
    }
  }

  return expiredBatches;
}

/**
 * Create stock transaction
 */
export async function createStockTransaction(input, tenantId, userId) {
  await connectDB();

  // Validate inventory item
  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: input.inventoryItemId,
      deletedAt: null,
    }),
  );

  if (!item) {
    throw new Error('Inventory item not found');
  }

  // Validate stock availability for outgoing transactions
  if (input.quantity < 0 && Math.abs(input.quantity) > item.availableQuantity) {
    throw new Error('Insufficient stock available');
  }

  // Generate transaction number
  const transactionNumber = await generateTransactionNumber(tenantId);

  // Parse dates
  const expiryDate = input.expiryDate
    ? input.expiryDate instanceof Date
      ? input.expiryDate
      : new Date(input.expiryDate)
    : undefined;

  // Create transaction
  const transaction = await StockTransaction.create({
    tenantId,
    inventoryItemId: input.inventoryItemId,
    transactionNumber,
    type: input.type,
    status: TransactionStatus.PENDING,
    quantity: input.quantity,
    batchNumber: input.batchNumber,
    expiryDate,
    unitPrice: input.unitPrice ? parseAmount(input.unitPrice, item.currency) : undefined,
    totalAmount:
      input.unitPrice && input.quantity
        ? parseAmount(input.unitPrice, item.currency) * Math.abs(input.quantity)
        : undefined,
    currency: item.currency,
    supplierId: input.supplierId,
    prescriptionId: input.prescriptionId,
    invoiceId: input.invoiceId,
    referenceNumber: input.referenceNumber,
    reason: input.reason,
    notes: input.notes,
    createdBy: userId,
  });

  // Update inventory item stock
  await updateItemStock(item, input.quantity, input.batchNumber, expiryDate);

  // Mark transaction as completed
  transaction.status = TransactionStatus.COMPLETED;
  await transaction.save();

  // Audit log
  await AuditLogger.auditWrite(
    'stock_transaction',
    transaction._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  // Real-time events (CursorMD/New: stock:updated, stock:low, medicine:expired)
  const payload = {
    inventoryItemId: item._id.toString(),
    name: item.name,
    availableQuantity: item.availableQuantity,
    totalQuantity: item.totalQuantity,
    transactionId: transaction._id.toString(),
    type: input.type,
  };
  await notifyStockUpdated(tenantId, payload);

  const threshold = item.lowStockThreshold ?? item.reorderPoint ?? 0;
  if (item.availableQuantity <= threshold) {
    await notifyStockLow(tenantId, {
      ...payload,
      lowStockThreshold: threshold,
    });
  }

  if (expiryDate && new Date(expiryDate) < new Date()) {
    await notifyMedicineExpired(tenantId, {
      inventoryItemId: item._id.toString(),
      name: item.name,
      batchNumber: input.batchNumber,
      expiryDate: expiryDate,
    });
  }

  return transaction;
}

/**
 * Create supplier
 */
export async function createSupplier(input, tenantId, userId) {
  await connectDB();

  const supplier = await Supplier.create({
    tenantId,
    ...input,
  });

  await AuditLogger.auditWrite(
    'supplier',
    supplier._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  return supplier;
}

/**
 * List suppliers
 */
export async function listSuppliers(tenantId, userId) {
  await connectDB();

  const suppliers = await Supplier.find(
    withTenant(tenantId, {
      deletedAt: null,
      isActive: true,
    }),
  )
    .sort({ name: 1 })
    .lean();

  return suppliers;
}

/**
 * List stock transactions with optional filters
 * Returns recent transactions with item name populated
 */
export async function listStockTransactions(tenantId, userId, options = {}) {
  await connectDB();

  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (options.type) {
    filter.type = options.type;
  }

  const limit = Math.min(options.limit ?? 100, 500);

  const transactions = await StockTransaction.find(filter)
    .populate('inventoryItemId', 'name code')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const list = transactions.map((tx) => ({
    ...tx,
    itemName: tx.inventoryItemId?.name ?? null,
    itemCode: tx.inventoryItemId?.code ?? null,
    inventoryItemId: tx.inventoryItemId?._id ?? tx.inventoryItemId,
  }));

  await AuditLogger.auditRead('stock_transaction', 'list', userId, tenantId);

  return list;
}

/**
 * Generate the next item code for a tenant
 * Returns a unique code in format MED-XXX
 */
export async function generateNextItemCode(tenantId) {
  await connectDB();

  // Count total items for this tenant (including deleted ones to ensure uniqueness)
  const totalItems = await InventoryItem.countDocuments({
    tenantId: typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId,
  });

  // Find the highest existing MED-XXX code to avoid conflicts
  const existingCodes = await InventoryItem.find(
    {
      tenantId: typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId,
      code: { $regex: /^MED-\d+$/ },
    },
    { code: 1 }
  ).lean();

  let maxNumber = 0;
  for (const item of existingCodes) {
    const match = item.code.match(/^MED-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  // Use the higher of totalItems or maxNumber + 1
  const nextNumber = Math.max(totalItems + 1, maxNumber + 1);
  const code = `MED-${String(nextNumber).padStart(3, '0')}`;

  return code;
}

/**
 * Update inventory item
 */
export async function updateInventoryItem(itemId, input, tenantId, userId) {
  await connectDB();

  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: itemId,
      deletedAt: null,
    }),
  );

  if (!item) {
    return null;
  }

  const before = item.toObject();

  // Parse amounts if provided
  const updateData = { ...input };
  if (input.costPrice !== undefined) {
    updateData.costPrice = parseAmount(input.costPrice, item.currency);
  }
  if (input.sellingPrice !== undefined) {
    updateData.sellingPrice = parseAmount(input.sellingPrice, item.currency);
  }

  const updated = await InventoryItem.findByIdAndUpdate(
    itemId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (updated) {
    await AuditLogger.auditWrite(
      'inventory_item',
      updated._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: updated.toObject() },
    );
  }

  return updated;
}

/**
 * Add stock/batch to an existing inventory item
 * Creates a new batch entry and updates total/available quantities
 */
export async function addStockToItem(itemId, batchData, tenantId, userId) {
  await connectDB();

  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: itemId,
      deletedAt: null,
    }),
  );

  if (!item) {
    return null;
  }

  const before = item.toObject();

  // Create the new batch entry
  const newBatch = {
    batchNumber: batchData.batchNumber,
    expiryDate: batchData.expiryDate ? new Date(batchData.expiryDate) : new Date(),
    quantity: batchData.quantity || 0,
    purchasePrice: batchData.purchasePrice,
    purchaseDate: batchData.purchaseDate ? new Date(batchData.purchaseDate) : new Date(),
    supplierId: batchData.supplierId,
  };

  // Add batch to the batches array
  item.batches.push(newBatch);

  // Update total and available quantities
  item.totalQuantity = (item.totalQuantity || 0) + (batchData.quantity || 0);
  item.availableQuantity = (item.availableQuantity || 0) + (batchData.quantity || 0);

  // Update top-level batch info if this is the first batch or user wants to update it
  if (!item.batchNumber || batchData.updateTopLevel) {
    item.batchNumber = batchData.batchNumber;
    item.expiryDate = newBatch.expiryDate;
    if (batchData.supplier) {
      item.supplier = batchData.supplier;
    }
  }

  // Update cost price if provided
  if (batchData.costPrice !== undefined) {
    item.costPrice = batchData.costPrice;
  }

  await item.save();

  // Check for low stock and send notification if needed
  if (item.totalQuantity <= item.lowStockThreshold) {
    try {
      await notifyStockLow(tenantId, item._id.toString(), item.name, item.totalQuantity);
    } catch (notifyError) {
      logger.error('Failed to send low stock notification:', notifyError);
    }
  }

  // Notify stock update
  try {
    await notifyStockUpdated(tenantId, item._id.toString(), item.name, item.totalQuantity);
  } catch (notifyError) {
    logger.error('Failed to send stock update notification:', notifyError);
  }

  await AuditLogger.auditWrite(
    'inventory_item',
    item._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: item.toObject() },
    { action: 'add_stock', batchData },
  );

  return item;
}

/**
 * Soft delete inventory item
 */
export async function deleteInventoryItem(itemId, tenantId, userId) {
  await connectDB();

  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: itemId,
      deletedAt: null,
    }),
  );

  if (!item) {
    return false;
  }

  item.deletedAt = new Date();
  item.isActive = false;
  await item.save();

  await AuditLogger.auditWrite(
    'inventory_item',
    item._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE,
  );

  return true;
}

/**
 * Remove a specific batch from an inventory item
 * Updates total/available quantities accordingly
 */
export async function removeBatchFromItem(itemId, batchNumber, tenantId, userId) {
  await connectDB();

  const item = await InventoryItem.findOne(
    withTenant(tenantId, {
      _id: itemId,
      deletedAt: null,
    }),
  );

  if (!item) {
    return null;
  }

  const before = item.toObject();

  // Find the batch to remove
  const batchIndex = item.batches.findIndex(
    (b) => b.batchNumber === batchNumber
  );

  if (batchIndex === -1) {
    // Batch not found - might be a top-level only item (no batches array)
    // In this case, clear the top-level batch info
    if (item.batchNumber === batchNumber) {
      item.batchNumber = '';
      item.expiryDate = null;
      await item.save();

      await AuditLogger.auditWrite(
        'inventory_item',
        item._id.toString(),
        userId,
        tenantId,
        AuditAction.UPDATE,
        { before, after: item.toObject() },
        { action: 'remove_batch', batchNumber },
      );

      return item;
    }
    return null;
  }

  // Get the quantity of the batch being removed
  const batchQuantity = item.batches[batchIndex].quantity || 0;

  // Remove the batch from the array
  item.batches.splice(batchIndex, 1);

  // Update total and available quantities
  item.totalQuantity = Math.max(0, (item.totalQuantity || 0) - batchQuantity);
  item.availableQuantity = Math.max(0, (item.availableQuantity || 0) - batchQuantity);

  // If this was the last batch, clear top-level batch info
  if (item.batches.length === 0) {
    item.batchNumber = '';
    item.expiryDate = null;
  }

  await item.save();

  await AuditLogger.auditWrite(
    'inventory_item',
    item._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: item.toObject() },
    { action: 'remove_batch', batchNumber, quantityRemoved: batchQuantity },
  );

  return item;
}

/**
 * Get all lots/batches from inventory items
 * Returns flattened list of all batches with item information
 * Optimized: Uses MongoDB aggregation pipeline instead of fetching all items and flattening in JS
 *
 * @param {string|ObjectId} tenantId - Tenant ID for multi-tenant isolation
 * @param {string|ObjectId} userId - User ID for audit logging
 * @param {Object} filters - Filter options: { expiringSoon?: boolean, expired?: boolean }
 * @returns {Promise<Array>} Array of lot objects with item and batch information
 *
 * @throws {Error} If database query fails
 *
 * @enterprise
 * - Uses aggregation pipeline for optimal performance
 * - Includes audit logging for compliance
 * - Proper error handling and logging
 * - Tenant isolation enforced
 * - Performance monitoring via measureTime
 */
export async function getAllLots(tenantId, userId, filters = {}) {
  await connectDB();

  // Validate inputs
  if (!tenantId) {
    throw new Error('tenantId is required');
  }
  if (!userId) {
    throw new Error('userId is required');
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Early return optimization: Check if any items exist before expensive aggregation
  const baseFilter = {
    tenantId: typeof tenantId === 'string' ? new mongoose.Types.ObjectId(tenantId) : tenantId,
    deletedAt: null,
    isActive: true,
  };

  const itemCount = await InventoryItem.countDocuments(baseFilter);
  if (itemCount === 0) {
    // No items exist - return empty array immediately
    await AuditLogger.auditWrite(
      'inventory_item',
      'lots',
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      { count: 0, filters, emptyCollection: true },
    );
    return [];
  }

  // Build match stage
  const matchStage = {
    ...baseFilter,
    $or: [
      { 'batches.0': { $exists: true } },
      { batchNumber: { $exists: true, $ne: '' } },
      { expiryDate: { $exists: true, $ne: null } },
    ],
  };

  // Filter by expiring soon (within next 30 days)
  if (filters.expiringSoon) {
    matchStage['batches.expiryDate'] = {
      $lte: thirtyDaysFromNow,
      $gte: now,
    };
  }

  // Filter by expired
  if (filters.expired) {
    matchStage['batches.expiryDate'] = { $lt: now };
  }

  // Use aggregation pipeline to flatten batches efficiently
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'primarySupplierId',
        foreignField: '_id',
        as: 'supplier',
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    {
      $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        code: 1,
        type: 1,
        unit: 1,
        location: 1,
        batches: 1,
        batchNumber: 1,
        expiryDate: 1,
        totalQuantity: 1,
        costPrice: 1,
        supplier: 1,
        supplierName: { $ifNull: ['$supplier.name', '$supplier'] },
      },
    },
    // Unwind batches array to create one document per batch
    {
      $unwind: {
        path: '$batches',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Filter out items without batches (if expiringSoon or expired filter is active)
    ...(filters.expiringSoon || filters.expired
      ? [
          {
            $match: {
              $or: [
                { batches: { $exists: true, $ne: null } },
                { expiryDate: { $exists: true, $ne: null } },
              ],
            },
          },
        ]
      : []),
    // Project final lot structure
    {
      $project: {
        _id: {
          $concat: [
            { $toString: '$_id' },
            '_',
            {
              $ifNull: [{ $ifNull: ['$batches.batchNumber', '$batchNumber'] }, 'default'],
            },
          ],
        },
        itemId: { $toString: '$_id' },
        itemName: '$name',
        itemCode: '$code',
        itemType: '$type',
        batchNumber: {
          $ifNull: [{ $ifNull: ['$batches.batchNumber', '$batchNumber'] }, '—'],
        },
        expiryDate: {
          $ifNull: ['$batches.expiryDate', '$expiryDate', now],
        },
        quantity: {
          $ifNull: ['$batches.quantity', '$totalQuantity', 0],
        },
        purchasePrice: {
          $ifNull: ['$batches.purchasePrice', '$costPrice'],
        },
        purchaseDate: '$batches.purchaseDate',
        supplierId: '$batches.supplierId',
        supplierName: '$supplierName',
        unit: '$unit',
        location: '$location',
        isExpired: {
          $cond: [
            {
              $lt: [{ $ifNull: ['$batches.expiryDate', '$expiryDate', now] }, now],
            },
            true,
            false,
          ],
        },
        isExpiringSoon: {
          $cond: [
            {
              $and: [
                {
                  $lte: [
                    { $ifNull: ['$batches.expiryDate', '$expiryDate', now] },
                    thirtyDaysFromNow,
                  ],
                },
                {
                  $gte: [{ $ifNull: ['$batches.expiryDate', '$expiryDate', now] }, now],
                },
              ],
            },
            true,
            false,
          ],
        },
      },
    },
    // Calculate days until expiry
    {
      $addFields: {
        daysUntilExpiry: {
          $cond: [
            {
              $lt: ['$expiryDate', now],
            },
            0,
            {
              $ceil: {
                $divide: [
                  { $subtract: ['$expiryDate', now] },
                  86400000, // milliseconds in a day
                ],
              },
            },
          ],
        },
      },
    },
    // Sort: expired first, then expiring soon, then by expiry date
    {
      $sort: {
        isExpired: -1,
        isExpiringSoon: -1,
        expiryDate: 1,
      },
    },
  ];

  try {
    const lots = await measureTime(`getAllLots-${tenantId}`, () =>
      InventoryItem.aggregate(pipeline),
    );

    // Audit list access
    await AuditLogger.auditWrite(
      'inventory_item',
      'lots',
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      { count: lots.length, filters },
    );

    return lots;
  } catch (error) {
    logger.error('Error fetching inventory lots:', {
      error: error.message,
      stack: error.stack,
      tenantId,
      userId,
      filters,
    });
    throw error;
  }
}
