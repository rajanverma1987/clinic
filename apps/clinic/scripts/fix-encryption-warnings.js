#!/usr/bin/env node
/**
 * Fix Encryption Warnings Script
 *
 * This script helps resolve "Unsupported state or unable to authenticate data"
 * warnings caused by changing the ENCRYPTION_KEY.
 *
 * OPTIONS:
 * 1. --clear-encrypted    : Clear all encrypted fields (diagnosis, notes, etc.)
 * 2. --drop-collections   : Drop affected collections entirely (DANGEROUS)
 * 3. --dry-run           : Show what would be affected without making changes
 *
 * USAGE:
 *   npm run fix:encryption -- --dry-run
 *   npm run fix:encryption -- --clear-encrypted
 *   npm run fix:encryption -- --drop-collections
 */

import mongoose from 'mongoose';
import { logger } from '../lib/utils/logger.js';
import connectDB from '../lib/db/connection.js';

const AFFECTED_COLLECTIONS = {
  prescriptions: {
    fields: ['diagnosis', 'chiefComplaint', 'additionalInstructions'],
    itemFields: ['instructions']
  },
  clinicalnotes: {
    fields: ['content', 'diagnosis']
  },
  patients: {
    fields: ['nationalId', 'medicalHistory', 'allergies', 'bloodType', 'chronicConditions']
  }
};

/**
 * Check if a value is in encrypted format (iv:tag:encrypted)
 */
function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const [ivHex, tagHex] = parts;
  return ivHex.length === 32 && tagHex.length === 32 && /^[0-9a-f]+$/i.test(ivHex);
}

/**
 * Dry run - show what would be affected
 */
async function dryRun() {
  logger.info('🔍 DRY RUN - Analyzing encrypted data...\n');

  for (const [collectionName, config] of Object.entries(AFFECTED_COLLECTIONS)) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const count = await collection.countDocuments();

      if (count === 0) {
        logger.info(`✓ ${collectionName}: No documents found`);
        continue;
      }

      // Find documents with encrypted fields
      const docs = await collection.find().toArray();
      let encryptedCount = 0;

      docs.forEach(doc => {
        const hasEncrypted = config.fields.some(field =>
          doc[field] && isEncrypted(doc[field])
        );
        if (hasEncrypted) encryptedCount++;

        // Check item fields (for prescriptions)
        if (config.itemFields && doc.items) {
          doc.items.forEach(item => {
            const itemHasEncrypted = config.itemFields.some(field =>
              item[field] && isEncrypted(item[field])
            );
            if (itemHasEncrypted) encryptedCount++;
          });
        }
      });

      if (encryptedCount > 0) {
        logger.warn(`⚠️  ${collectionName}: ${encryptedCount}/${count} documents have encrypted data`);
        logger.info(`   Fields: ${config.fields.join(', ')}`);
      } else {
        logger.info(`✓ ${collectionName}: ${count} documents, none encrypted`);
      }
    } catch (err) {
      logger.error(`Error analyzing ${collectionName}:`, err);
    }
  }

  logger.info('\n📝 SUMMARY:');
  logger.info('Run with --clear-encrypted to clear encrypted fields');
  logger.info('Run with --drop-collections to drop entire collections (DANGEROUS)');
}

/**
 * Clear encrypted fields (set to null)
 */
async function clearEncryptedFields() {
  logger.info('🧹 Clearing encrypted fields...\n');

  for (const [collectionName, config] of Object.entries(AFFECTED_COLLECTIONS)) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const docs = await collection.find().toArray();

      let clearedCount = 0;

      for (const doc of docs) {
        const updates = {};
        let needsUpdate = false;

        // Check main fields
        config.fields.forEach(field => {
          if (doc[field] && isEncrypted(doc[field])) {
            updates[field] = null;
            needsUpdate = true;
          }
        });

        // Check item fields (for prescriptions)
        if (config.itemFields && doc.items) {
          doc.items.forEach((item, index) => {
            config.itemFields.forEach(field => {
              if (item[field] && isEncrypted(item[field])) {
                updates[`items.${index}.${field}`] = null;
                needsUpdate = true;
              }
            });
          });
        }

        if (needsUpdate) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: updates }
          );
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        logger.info(`✓ ${collectionName}: Cleared encrypted fields in ${clearedCount} documents`);
      } else {
        logger.info(`✓ ${collectionName}: No encrypted fields found`);
      }
    } catch (err) {
      logger.error(`Error clearing ${collectionName}:`, err);
    }
  }

  logger.info('\n✅ Done! Encrypted fields have been cleared.');
  logger.info('⚠️  Note: Historical data is now empty. New data will encrypt correctly.');
}

/**
 * Drop affected collections entirely (DANGEROUS)
 */
async function dropCollections() {
  logger.warn('\n⚠️  WARNING: This will DELETE ALL DATA in affected collections!');
  logger.warn('Collections to drop:', Object.keys(AFFECTED_COLLECTIONS).join(', '));
  logger.warn('\nPress Ctrl+C to cancel...\n');

  // Wait 5 seconds for user to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  logger.info('🗑️  Dropping collections...\n');

  for (const collectionName of Object.keys(AFFECTED_COLLECTIONS)) {
    try {
      await mongoose.connection.db.dropCollection(collectionName);
      logger.info(`✓ Dropped ${collectionName}`);
    } catch (err) {
      if (err.message.includes('ns not found')) {
        logger.info(`✓ ${collectionName} does not exist (skipped)`);
      } else {
        logger.error(`Error dropping ${collectionName}:`, err);
      }
    }
  }

  logger.info('\n✅ Done! Collections have been dropped.');
  logger.info('⚠️  All data is gone. Collections will be recreated on next use.');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const shouldClear = args.includes('--clear-encrypted');
  const shouldDrop = args.includes('--drop-collections');

  if (!isDryRun && !shouldClear && !shouldDrop) {
    logger.error('❌ Missing argument!');
    logger.info('Usage:');
    logger.info('  npm run fix:encryption -- --dry-run');
    logger.info('  npm run fix:encryption -- --clear-encrypted');
    logger.info('  npm run fix:encryption -- --drop-collections');
    process.exit(1);
  }

  try {
    logger.info('🔌 Connecting to database...');
    await connectDB();
    logger.info('✅ Connected\n');

    if (isDryRun) {
      await dryRun();
    } else if (shouldClear) {
      await clearEncryptedFields();
    } else if (shouldDrop) {
      await dropCollections();
    }

  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('\n👋 Disconnected from database');
  }
}

main();
