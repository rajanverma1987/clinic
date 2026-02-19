/**
 * Create dashboard/stats indexes for /api/dashboard/all and dashboard widgets.
 * Run once after deploy or when adding a new tenant DB.
 * Usage: node -r dotenv/config scripts/create-dashboard-indexes.js dotenv_config_path=.env.local
 *
 * Uses native driver so it works without loading ESM model files.
 * All indexes created with background: true to avoid blocking.
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
    name: 'dashboard_appt_date_status',
  },
  {
    collection: 'appointments',
    key: { tenantId: 1, status: 1, createdAt: -1 },
    name: 'dashboard_appt_status_created',
  },
  {
    collection: 'invoices',
    key: { tenantId: 1, status: 1, dueDate: 1 },
    name: 'dashboard_invoice_status_due',
  },
  {
    collection: 'invoices',
    key: { tenantId: 1, invoiceDate: 1, status: 1 },
    name: 'revenue_stats_idx',
  },
  {
    collection: 'patients',
    key: { tenantId: 1, createdAt: -1 },
    name: 'dashboard_patient_created',
  },
  {
    collection: 'queues',
    key: { tenantId: 1, status: 1 },
    name: 'dashboard_queue_status',
  },
  {
    collection: 'inventoryitems',
    key: { tenantId: 1, availableQuantity: 1, reorderPoint: 1 },
    name: 'dashboard_inventory_stock',
  },
];

const INDEX_OPTS = { background: true };

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ No database connection');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  for (const { collection, key, name } of INDEXES) {
    try {
      await db.collection(collection).createIndex(key, { ...INDEX_OPTS, name });
      created++;
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict' || /already exists|duplicate key/i.test(err.message)) {
        skipped++;
      } else {
        console.error(`❌ Failed to create index ${name} on ${collection}:`, err.message);
        process.exit(1);
      }
    }
  }
  console.log('✅ Dashboard indexes: ' + created + ' created, ' + skipped + ' already present');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
