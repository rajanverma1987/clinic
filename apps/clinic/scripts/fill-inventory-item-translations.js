/**
 * One-time script: fill name_ar and name_es for inventory items that are missing them.
 * Uses the primary `name` as the initial value so the Items table shows something
 * when the clinic account language is Arabic or Spanish. You can later edit items
 * to replace with proper translations.
 *
 * Usage (from apps/clinic):
 *   node -r dotenv/config scripts/fill-inventory-item-translations.js dotenv_config_path=.env.local
 *
 * Or: npm run inventory:fill-translations
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function fillInventoryItemTranslations() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log('Filling missing name_ar / name_es from name for inventory items...\n');

  const InventoryItem = mongoose.connection.collection('inventoryitems');

  const missingAr = await InventoryItem.find({
    deletedAt: null,
    $or: [{ name_ar: { $in: [null, ''] } }, { name_ar: { $exists: false } }],
  })
    .project({ _id: 1, name: 1 })
    .toArray();

  const missingEs = await InventoryItem.find({
    deletedAt: null,
    $or: [{ name_es: { $in: [null, ''] } }, { name_es: { $exists: false } }],
  })
    .project({ _id: 1, name: 1 })
    .toArray();

  let updatedAr = 0;
  let updatedEs = 0;

  for (const item of missingAr) {
    if (!item.name) continue;
    await InventoryItem.updateOne(
      { _id: item._id },
      { $set: { name_ar: item.name } },
    );
    updatedAr++;
  }

  for (const item of missingEs) {
    if (!item.name) continue;
    await InventoryItem.updateOne(
      { _id: item._id },
      { $set: { name_es: item.name } },
    );
    updatedEs++;
  }

  console.log(`  name_ar filled: ${updatedAr} item(s)`);
  console.log(`  name_es filled: ${updatedEs} item(s)`);
  console.log('\n✅ Done. Inventory Items tab will show these names when the clinic language is Arabic or Spanish.');
  console.log('   Edit individual items to replace with proper Arabic/Spanish translations.\n');

  await mongoose.connection.close();
  process.exit(0);
}

fillInventoryItemTranslations().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
