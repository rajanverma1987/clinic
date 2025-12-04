import mongoose, { Schema } from 'mongoose';

export const InventoryItemType = {
  MEDICINE: 'medicine',
  MEDICAL_SUPPLY: 'medical_supply',
  EQUIPMENT: 'equipment',
  CONSUMABLE: 'consumable',
  OTHER: 'other',
};

const InventoryItemSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    
    // Item Details
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(InventoryItemType),
      required: true,
      default: InventoryItemType.MEDICINE,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Drug Information
    drugId: {
      type: Schema.Types.ObjectId,
      ref: 'Drug',
    },
    genericName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    form: String,
    strength: String,
    
    // Stock Management
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'units',
    },
    
    // Batches
    batches: [
      {
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        quantity: { type: Number, required: true },
        purchasePrice: Number,
        purchaseDate: Date,
        supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
      },
    ],
    
    // Pricing
    costPrice: Number, // Minor units
    sellingPrice: Number, // Minor units
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    
    // Stock Alerts
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    reorderPoint: {
      type: Number,
      default: 5,
    },
    reorderQuantity: Number,
    
    // Supplier
    primarySupplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    
    // Location
    location: String,
    
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InventoryItemSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
InventoryItemSchema.index({ tenantId: 1, name: 'text', genericName: 'text', brandName: 'text' });
InventoryItemSchema.index({ tenantId: 1, type: 1 });
InventoryItemSchema.index({ tenantId: 1, drugId: 1 });
InventoryItemSchema.index({ tenantId: 1, totalQuantity: 1 }); // For low stock queries
InventoryItemSchema.index({ tenantId: 1, deletedAt: 1 });
InventoryItemSchema.index({ 'batches.expiryDate': 1 }); // For expiry tracking

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);

