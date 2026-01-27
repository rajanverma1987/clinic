/**
 * Database Restore Script
 * Restores MongoDB from backup
 * Based on NEW-PLANS.md requirements
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

/**
 * List available backups
 */
async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter((f) => f.endsWith('.tar.gz'))
      .map((f) => ({
        filename: f,
        path: path.join(BACKUP_DIR, f),
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename)); // Newest first

    return backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
    return [];
  }
}

/**
 * Extract backup archive
 */
async function extractBackup(backupPath) {
  const extractDir = backupPath.replace('.tar.gz', '');
  
  console.log('📦 Extracting backup archive...');
  await execAsync(`tar -xzf "${backupPath}" -C "${path.dirname(backupPath)}"`);
  
  return extractDir;
}

/**
 * Restore database from backup
 */
async function restoreDatabase(backupPath, options = {}) {
  const { drop = false, dryRun = false } = options;

  console.log(`🔄 Starting database restore from: ${backupPath}`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  try {
    // Extract backup
    const extractDir = await extractBackup(backupPath);

    // Find the actual dump directory
    const dirs = await fs.readdir(extractDir);
    const dumpDir = dirs.find((d) => {
      const dirPath = path.join(extractDir, d);
      return fs.stat(dirPath).then((s) => s.isDirectory());
    });

    if (!dumpDir) {
      throw new Error('Could not find dump directory in backup');
    }

    const fullDumpPath = path.join(extractDir, dumpDir);

    // Build mongorestore command
    let command = `mongorestore --uri="${MONGODB_URI}" "${fullDumpPath}" --gzip`;

    if (drop) {
      command += ' --drop';
      console.log('⚠️  WARNING: --drop flag enabled. Existing data will be deleted!');
    }

    if (dryRun) {
      console.log('🔍 Would execute:', command);
      console.log('✅ DRY RUN completed');
      return { success: true, dryRun: true };
    }

    // Confirm before proceeding
    if (drop) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question('⚠️  This will DELETE all existing data. Continue? (yes/no): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Restore cancelled');
        return { success: false, cancelled: true };
      }
    }

    console.log('🔄 Running mongorestore...');
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('done')) {
      console.warn('⚠️  mongorestore warnings:', stderr);
    }

    // Cleanup extracted files
    await fs.rm(extractDir, { recursive: true, force: true });

    console.log('✅ Database restore completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

/**
 * Interactive restore
 */
async function interactiveRestore() {
  console.log('📋 Available backups:\n');

  const backups = await listBackups();

  if (backups.length === 0) {
    console.log('❌ No backups found');
    return;
  }

  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.filename}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question('\nSelect backup number to restore (or "q" to quit): ', resolve);
  });

  rl.close();

  if (answer.toLowerCase() === 'q') {
    console.log('❌ Restore cancelled');
    return;
  }

  const index = parseInt(answer, 10) - 1;
  if (index < 0 || index >= backups.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const selectedBackup = backups[index];

  const dropAnswer = await new Promise((resolve) => {
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl2.question('Drop existing collections? (yes/no): ', (ans) => {
      rl2.close();
      resolve(ans);
    });
  });

  const drop = dropAnswer.toLowerCase() === 'yes';

  await restoreDatabase(selectedBackup.path, { drop });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const backupFile = args[0];
  const drop = args.includes('--drop');
  const dryRun = args.includes('--dry-run');

  if (backupFile) {
    // Restore specific backup
    await restoreDatabase(backupFile, { drop, dryRun });
  } else {
    // Interactive mode
    await interactiveRestore();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { restoreDatabase, listBackups };
