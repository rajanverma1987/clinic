/**
 * One-time script: set isPrimaryAccount = true for the first user (by createdAt) per tenant.
 * Run once to make existing clinics have a primary account that can purchase/manage subscription.
 *
 * Usage: node -r dotenv/config scripts/set-primary-accounts.js dotenv_config_path=.env.local
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const User = require('../models/User').default || require('../models/User');
const Tenant = require('../models/Tenant').default || require('../models/Tenant');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function setPrimaryAccounts() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log('Setting primary account (first user per tenant by createdAt)...\n');

  const tenants = await Tenant.find().select('_id name').lean();
  let updated = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const firstUser = await User.findOne({ tenantId: tenant._id })
      .sort({ createdAt: 1 })
      .select('_id email firstName lastName role createdAt isPrimaryAccount')
      .lean();

    if (!firstUser) {
      console.log(`  ⏭️  ${tenant.name}: no users, skip`);
      skipped++;
      continue;
    }

    if (firstUser.isPrimaryAccount) {
      console.log(`  ✓  ${tenant.name}: ${firstUser.email} already primary`);
      skipped++;
      continue;
    }

    await User.updateMany({ tenantId: tenant._id }, { $set: { isPrimaryAccount: false } });
    await User.updateOne({ _id: firstUser._id }, { $set: { isPrimaryAccount: true } });
    console.log(`  ✅ ${tenant.name}: set ${firstUser.email} (${firstUser.role}) as primary`);
    updated++;
  }

  console.log(`\n✅ Done. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.connection.close();
  process.exit(0);
}

setPrimaryAccounts().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
