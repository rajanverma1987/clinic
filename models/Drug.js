import mongoose, { Schema } from 'mongoose';

export const DrugForm = {
    TABLET: 'tablet',
    CAPSULE: 'capsule',
    SYRUP: 'syrup',
    INJECTION: 'injection',
    DROPS: 'drops',
    CREAM: 'cream',
    OINTMENT: 'ointment',
    INHALER: 'inhaler',
    PATCH: 'patch',
    OTHER: 'other',
};

const DrugSchema = new Schema(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            default: null, // null = global drug
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        genericName: {
            type: String,
            trim: true,
            index: true,
        },
        brandName: {
            type: String,
            trim: true,
        },

        // Drug Details
        form: {
            type: String,
            enum: Object.values(DrugForm),
            required: true,
        },
        strength: {
            type: String,
            trim: true,
        },
        unit: {
            type: String,
            trim: true,
        },

        // Classification
        category: {
            type: String,
            trim: true,
            index: true,
        },
        schedule: {
            type: String,
            trim: true,
        },

        // Regional Information
        region: {
            type: String,
            trim: true,
        },
        localName: {
            type: String,
            trim: true,
        },
        availableInRegions: [String],

        // Prescription Requirements
        requiresPrescription: {
            type: Boolean,
            default: true,
        },
        maxQuantity: Number,
        commonDosages: [String],

        // Metadata
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DrugSchema.index({ name: 'text', genericName: 'text', brandName: 'text' });
DrugSchema.index({ tenantId: 1, isActive: 1 });
DrugSchema.index({ region: 1, isActive: 1 });
DrugSchema.index({ category: 1 });

export default mongoose.models.Drug || mongoose.model('Drug', DrugSchema);

