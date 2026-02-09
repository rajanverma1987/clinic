/**
 * Create dashboard/stats indexes. Run after deploy or when adding a new tenant DB.
 * Usage: node -r dotenv/config scripts/create-dashboard-indexes.js dotenv_config_path=.env.local
 *
 * Uses native driver so it works without loading ESM model files.
 */

require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set');
  process.exit(1);
}

const INDEXES = [
  {
    collection: 'appointments',
    key: { tenantId: 1, appointmentDate: 1, status: 1 },
    name: 'dashboard_stats_idx',
  },
  { collection: 'patients', key: { tenantId: 1, createdAt: 1 }, name: 'patient_stats_idx' },
  {
    collection: 'invoices',
    key: { tenantId: 1, invoiceDate: 1, status: 1 },
    name: 'revenue_stats_idx',
  },
  { collection: 'queues', key: { tenantId: 1, joinedAt: 1, status: 1 }, name: 'queue_stats_idx' },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ No database connection');
    process.exit(1);
  }

  try {
    for (const { collection, key, name } of INDEXES) {
      await db.collection(collection).createIndex(key, { name });
    }
    console.log('✅ Dashboard indexes created or already present');
  } catch (err) {
    console.error('❌ Failed to create indexes:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
