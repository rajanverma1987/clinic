/**
 * Inventory service
 * Handles all inventory-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import InventoryItem from '@/models/InventoryItem.js';
import StockTransaction, { TransactionStatus } from '@/models/StockTransaction.js';
import Supplier from '@/models/Supplier.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { parseAmount } from './tax-engine.service.js';
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination.js';

/**
 * Generate unique transaction number for a tenant
 */
async function generateTransactionNumber(tenantId) {
  await connectDB();

  const lastTransaction = await StockTransaction.findOne(
    withTenant(tenantId, {}),
    { transactionNumber: 1 }
  )
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
      const expiryDate = batch.expiryDate instanceof Date
        ? batch.expiryDate
        : new Date(batch.expiryDate);
      
      batches.push({
        batchNumber: batch.batchNumber,
        expiryDate,
        quantity: batch.quantity,
        purchasePrice: batch.purchasePrice
          ? parseAmount(batch.purchasePrice, input.currency || 'USD')
          : undefined,
        purchaseDate: batch.purchaseDate
          ? (batch.purchaseDate instanceof Date ? batch.purchaseDate : new Date(batch.purchaseDate))
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
    sellingPrice: input.sellingPrice ? parseAmount(input.sellingPrice, input.currency || 'USD') : undefined,
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
    AuditAction.CREATE
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
    })
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

  // Low stock filter
  if (query.lowStock) {
    filter.availableQuantity = { $lte: '$lowStockThreshold' };
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

  // Get total count
  const total = await InventoryItem.countDocuments(filter);

  // Get paginated results
  const items = await InventoryItem.find(filter)
    .populate('primarySupplierId', 'name')
    .sort({ name: 1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'inventory_item',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: items.length, filters: query }
  );

  return createPaginationResult(items, total, page || 1, limit || 10);
}

/**
 * Get low stock items
 */
export async function getLowStockItems(tenantId, userId) {
  await connectDB();

  const items = await InventoryItem.find(
    withTenant(tenantId, {
      deletedAt: null,
      isActive: true,
      $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
    })
  )
    .populate('primarySupplierId', 'name code phone')
    .sort({ availableQuantity: 1 })
    .lean();

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
    })
  ).lean();

  const expiredBatches = [];

  for (const item of items) {
    const expired = item.batches.filter(
      (batch) => new Date(batch.expiryDate) < new Date()
    );
    
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
    })
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
    ? (input.expiryDate instanceof Date ? input.expiryDate : new Date(input.expiryDate))
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
    totalAmount: input.unitPrice && input.quantity
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
    AuditAction.CREATE
  );

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
    AuditAction.CREATE
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
    })
  )
    .sort({ name: 1 })
    .lean();

  return suppliers;
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
    })
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
    { new: true, runValidators: true }
  );

  if (updated) {
    await AuditLogger.auditWrite(
      'inventory_item',
      updated._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: updated.toObject() }
    );
  }

  return updated;
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
    })
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
    AuditAction.DELETE
  );

  return true;
}

