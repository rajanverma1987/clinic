/**
 * Backup Statistics Script
 * Shows backup statistics and information
 */

import BackupManager from '../lib/backup/backup-manager.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  try {
    const manager = new BackupManager();
    const stats = await manager.getStats();

    console.log('\n📊 Backup Statistics\n');
    console.log(`Total Backups: ${stats.total}`);
    console.log(`Total Size: ${stats.totalSizeMB} MB`);
    console.log('\nBy Type:');
    console.log(`  Daily: ${stats.byType.daily}`);
    console.log(`  Weekly: ${stats.byType.weekly}`);
    console.log(`  Monthly: ${stats.byType.monthly}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
